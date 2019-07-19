import {Logger} from "@simplism/core";
import {SocketServer} from "@simplism/socket-server";
import {OrmService} from "@simplism/orm-service";
import {ErpMysqlQueryService} from "./services/ErpMysqlQueryService";
import * as mosca from "mosca";

Logger.setDefaultConfig({
  consoleLogSeverities: process.env.NODE_ENV === "production" ? [] : ["log", "info", "warn", "error"],
  fileLogSeverities: ["log", "info", "warn", "error"]
});

const server = new SocketServer([
  OrmService,
  ErpMysqlQueryService
]);

const port = Number(process.env.SERVER_PORT);

server.startAsync(port).catch(err => {
  console.error(err);
});


const mqttServer = new mosca.Server({
  port: 1883
});
mqttServer.on("ready", () => {
  console.log("MQTT 준비됨");
});
mqttServer.on("clientConnected", (client: mosca.Client) => {
  console.log("client connected", client.id);
});
mqttServer.on("published", (packet: mosca.Packet) => {
  if (packet.topic.startsWith("/")) {
    const listeners = server.getEventListeners("WeightChangedEvent");
    if (listeners.length > 0) {
      for (const listener of listeners) {
        server.emit(listener.id, JSON.parse(packet.payload));
      }
    }
  }
});