export namespace RedisParserTypes {
  export type RESP_INPUT_TYPE =
    | "string"
    | "array"
    | "bulkstring"
    | "number"
    | "error";
  export type Command = {
    length: number;
    type: RESP_INPUT_TYPE;
    value?: ValueType;
  };

  export type History = {
    pc: RESP_INPUT_TYPE | null;
    length: number;
    commands: Array<Command>;
    results: Array<string>;
  };

  export type ValueType = string | number | null | undefined;

  export type Input = {
    type: RESP_INPUT_TYPE | "length";
    next?: RESP_INPUT_TYPE;
    value: string;
    isCommand: boolean;
    children?: Array<Input>;
  };
}
