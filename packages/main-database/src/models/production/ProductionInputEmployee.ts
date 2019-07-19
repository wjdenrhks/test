import {Column, Table} from "@simplism/orm-query";

@Table({description: "호기별 생산인원"})
export class ProductionInputEmployee {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "년"})
  public year!: number;

  @Column({description: "월"})
  public month!: number;

  @Column({description: "호기"})
  public equipmentId!: number;

  @Column({description: "투입 인원"})
  public inputEmployeeQuantity!: number;

  //------------------------------------

  //------------------------------------

}