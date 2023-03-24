import * as net from "net";
import { RedisParser2 } from "../../services";
import { generateID } from "@jetit/id";
type Pair2 = { socket: net.Socket; parser: RedisParser2 };
const connections2: Map<string, Pair2> = new Map();

export function createServer() {
  const server = net.createServer();
  server.on("connection", (connection) => {
    const clientId = generateID("HEX");
    // console.log("New connection", clientId);

    const pair2: Pair2 = {
      socket: connection,
      parser: new RedisParser2(connection, clientId),
    };

    connections2.set(clientId, pair2);
    // setupSocket(pair);
    setupSocket2(pair2);
  });
  return server;
}

function setupSocket2(pair: Pair2) {
  const { parser, socket } = pair;
  socket.on("data", function (buffer) {
    const data = buffer.toString();
    parser.pushCommand(data);
  });

  socket.on("end", () => {
    console.log("Connection closed");
  });

  socket.on("error", () => {
    console.log("ERRORED");
  });
}
