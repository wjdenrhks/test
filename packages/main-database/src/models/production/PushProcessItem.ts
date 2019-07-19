import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Employee} from "../base-info/Employee";
import {DateTime} from "@simplism/core";
import {Goods} from "../base-info/Goods";
import {LotHistory, PushProcess, Warehouse} from "../..";

@Table({description: "밀어내기 산출항목"})
export class PushProcessItem {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "밀어내기 아이디"})
  public pushProcessId!: number;

  @Column({description: "순서", nullable: true})
  public seq?: number;

  @Column({description: "산출 구분"})
  public productionType!: "재생" | "판매" | "폐기";

  @Column({description: "산출 품목", nullable: true})
  public goodId?: number;

  @Column({description: "산출 LOT", nullable: true})
  public lotId?: number;

  @Column({description: "산출중량", dataType: "DECIMAL(17,6)", nullable: true})
  public weight?: number;

  @Column({description: "창고", nullable: true})
  public warehouseId?: number;

  @Column({description: "작성자 아이디"})
  public createdByEmployeeId!: number;

  @Column({description: "작성일시"})
  public createdAtDateTime!: DateTime;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("pushProcessId", () => PushProcess, "밀어내기")
  public pushProcess?: PushProcess;

  @ForeignKey("goodId", () => Goods, "투입 품목")
  public goods?: Goods;

  @ForeignKey("lotId", () => LotHistory, "산출 LOT")
  public lot?: LotHistory;

  @ForeignKey("warehouseId", () => Warehouse, "창고")
  public warehouse?: Warehouse;

  @ForeignKey("createdByEmployeeId", () => Employee, "작성자")
  public employee?: Employee;

  //------------------------------------

}