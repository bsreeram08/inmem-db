export const CARRIAGE_RETURN = `\r\n`;
import { COMMANDS, Commands, executeInput } from "../../executor";
import { RedisParserTypes as Resp } from "./types";
import * as net from "net";

export class RedisParser2 {
  private inputs: Array<Resp.Input>;
  private history: Array<Array<Resp.Input>>;

  private isInputOf: Array<number>;
  private nextCommand?: Resp.RESP_INPUT_TYPE;

  constructor(private socket: net.Socket, private clientId: string) {
    this.history = new Array();
    this.inputs = new Array();
    this.isInputOf = [];
    this.nextCommand = "array";
  }
  /**
   *
   * @param input Input Command
   */
  async pushCommand(input: string): Promise<Array<string> | void> {
    const _input = this.parseInput(input);
    const prev = this.getInput()[this.getInput().length - 1];
    const command = (
      this.inputParser[_input.slice(0, 1)] ?? this.inputParser["value"]
    )(_input, prev?.next);
    if (this.nextCommand && this.nextCommand == "array") {
      this.isInputOf.push(
        (this.inputs.length == 0 ? 1 : this.inputs.length) - 1
      );
      this.nextCommand = undefined;
    }
    this.getInput().push(command);
    if (this.needsParsing()) {
      const results = await this.parser(this.inputs);
      this.socket.write(results.join(CARRIAGE_RETURN) + CARRIAGE_RETURN);
      this.reset();
    }
  }

  private getInput() {
    let input = this.inputs;
    this.isInputOf.forEach((v) => {
      console.log(`Checking input of ${JSON.stringify(input)}`);
      if (
        (this.isInputOf[0] === 0 && this.inputs.length == 0) ||
        input.length === 0
      )
        return input;
      else if (!input[v]?.children) {
        this.socket.write("Invalid input");
        this.history.push(this.inputs);
        this.reset();
      } else input = input[v].children!;
    });
    return input;
  }

  private needsParsing(
    inputs: Array<Resp.Input> = this.inputs,
    shouldBeOfLength = 1
  ): boolean {
    if (
      inputs.length == 0 ||
      !!this.nextCommand ||
      inputs.length < shouldBeOfLength
    )
      return false;
    let canBeParsed = true;
    inputs.forEach((v) => {
      if (v.type == "length" && v.next == "array" && !!v.children)
        canBeParsed =
          canBeParsed && this.needsParsing(v.children, parseInt(v.value));
    });
    return canBeParsed;
  }

  private async parser(inputs: Array<Resp.Input>): Promise<string[]> {
    console.log("INPUTS:\n", JSON.stringify(inputs, null, 4));
    const results: Array<string> = [];
    if (inputs.length == 0) return results;
    else if (inputs[0].next == "array")
      results.push(...(await this.parser(inputs[0].children ?? [])));
    else if (inputs[0].isCommand)
      results.push(await executeInput[inputs[0].value as COMMANDS](inputs));
    else results.push(await executeInput[inputs[1].value as COMMANDS](inputs));
    return results;
  }

  private inputParser: {
    [key: string]: (
      command: string,
      next?: Resp.RESP_INPUT_TYPE | "length"
    ) => Resp.Input;
  } = {
    $: (cmd) => {
      const length = parseInt(cmd.slice(1).split(CARRIAGE_RETURN)[0]);
      this.nextCommand = "bulkstring";
      return {
        type: "length",
        value: length.toString(),
        next: "bulkstring",
        isCommand: false,
      };
    },
    "*": (cmd) => {
      const length = parseInt(cmd.slice(1).split(CARRIAGE_RETURN)[0]);
      this.nextCommand = "array";
      return {
        type: "length",
        value: length.toString(),
        next: "array",
        isCommand: false,
        children: [],
      };
    },
    "+": (cmd) => {
      const data = cmd.slice(1).split(CARRIAGE_RETURN)[0];
      return {
        type: "string",
        value: data,
        isCommand: Commands.includes(data),
      };
    },
    "-": (cmd) => {
      const data = cmd.slice(1).split(CARRIAGE_RETURN)[0];
      return {
        type: "error",
        value: data,
        isCommand: false,
      };
    },
    ":": (cmd) => {
      const data = cmd.slice(1).split(CARRIAGE_RETURN)[0];
      return {
        type: "number",
        value: data,
        isCommand: !!executeInput[data as COMMANDS],
      };
    },
    value: (cmd, prev) => {
      const data = cmd.split(CARRIAGE_RETURN)[0];
      this.nextCommand = undefined;
      return {
        isCommand: !!executeInput[data as COMMANDS],
        type: prev!,
        value: data,
      };
    },
  };

  private parseInput(command: string) {
    return command.split(CARRIAGE_RETURN)[0];
  }

  private reset() {
    this.inputs = [];
    this.isInputOf = [];
    this.nextCommand = "array";
  }
}
