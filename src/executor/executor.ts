import { RedisParserTypes as Resp } from "../services";

const storage = new Map<string, string>();
const timerStorage = new Map<string, NodeJS.Timer>();

export const executeInput = {
  PING: async (data: Array<Resp.Input>) => "PONG",
  EXIT: async (data: Array<Resp.Input>) => "EXIT",
  SET: async (data: Array<Resp.Input>) => {
    console.log("called to execute set", data);

    const parsedData: Array<Resp.Input> = [];
    data.forEach((v) => (v.type !== "length" ? parsedData.push(v) : null));
    if (parsedData.length < 3)
      return "Error: Required minimum of key and value";
    storage.set(parsedData[1].value, parsedData[2].value);
    setOptions.forEach((option) => {
      const optionIndex = parsedData.findIndex((v) => v.value === option);
      if (optionIndex != -1) {
        SET_OPTIONS[parsedData[optionIndex].value]({
          
        })
      }
    });
    return "ADDED";
  },
} as const;

export type COMMANDS = keyof typeof executeInput;

export const Commands = Object.keys(executeInput);
/**
 * SET COMMAND OPTIONS
 */
const setOptions = ["EX", "PX", "EXAT", "PXAT", "NX", "XX", "KEEPTTL", "GET"];
interface ISetOptions {
  key: string;
  ttl: number;
  value: string;
}
const SET_OPTIONS = {
  EX: (o: ISetOptions) => {
    timerStorage.set(
      o.key,
      setTimeout(() => {
        storage.delete(o.key);
      }, o.ttl * 1000)
    );
  },
  PX: (o: ISetOptions) => {
    timerStorage.set(
      o.key,
      setTimeout(() => {
        storage.delete(o.key);
      }, o.ttl)
    );
  },
  EXAT: (o: ISetOptions) => {
    const currentTime = new Date().getTime();
    const ts = o.ttl * 1000;
    if (currentTime > ts) {
      storage.delete(o.key);
      return;
    }
    timerStorage.set(
      o.key,
      setTimeout(() => {
        storage.delete(o.key);
      }, ts - currentTime)
    );
  },
  PXAT: (o: ISetOptions) => {
    const currentTime = new Date().getTime();
    if (currentTime > o.ttl) {
      storage.delete(o.key);
      return;
    }
    timerStorage.set(
      o.key,
      setTimeout(() => {
        storage.delete(o.key);
      }, o.ttl - currentTime)
    );
  },
  NX: (o: ISetOptions) => {
    if (!storage.get(o.key)) {
      storage.set(o.key, o.value);
    }
  },
  XX: (o: ISetOptions) => {
    if (storage.get(o.key)) {
      storage.set(o.key, o.value);
    }
  },
  GET: (o: ISetOptions) => {
    return storage.get(o.key);
  },
  KEEPTTL: (o: ISetOptions) => {
    timerStorage.get(o.key)?.refresh();
  },
};
