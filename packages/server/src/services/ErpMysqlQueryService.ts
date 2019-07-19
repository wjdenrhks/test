import {SocketServiceBase} from "@simplism/socket-server";
import * as mysql from "mysql";

export class ErpMysqlQueryService extends SocketServiceBase {
  public async executeQueryAsync(query: string): Promise<any> {
    return await new Promise<any>((resolve, reject) => {
      const conn = mysql.createConnection({
        host: "175.126.232.187",
        port: 3306,
        user: "newgratech",
        password: "newgratechdp%!^$",
        database: "newgratech"
      });

      conn.connect();

      conn.query(query, (err, results, fields) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(results);
      });

      conn.end();
    });
  }

  public async devExecuteQueryAsync(query: string): Promise<any> {
    return await new Promise<any>((resolve, reject) => {
      const conn = mysql.createConnection({
        host: "localhost",
        port: 3306,
        user: "root",
        password: "1234",
        database: "newgratech"
      });

      conn.connect();

      conn.query(query, (err, results, fields) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(results);
      });

      conn.end();
    });
  }
}