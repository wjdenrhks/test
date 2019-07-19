import {Column, Table} from "@simplism/orm-query";

@Table({description: "기타"})
export class Assets {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "데이터"})
  public data!: Buffer;

  //------------------------------------

}