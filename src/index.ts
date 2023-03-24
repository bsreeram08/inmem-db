import { createServer } from "./tcp";

function bootstrap() {
  const server = createServer();
  server.listen(4001);
}
bootstrap();
