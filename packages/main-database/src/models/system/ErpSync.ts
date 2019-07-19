import {Column, Table} from "@simplism/orm-query";
import {DateTime} from "@simplism/core";

@Table({description: "ERP 동기화 정보"})
export class ErpSync {
  @Column({description: "코드"})
  public code!: string;

  @Column({description: "동기화시간"})
  public syncDate!: DateTime;

}