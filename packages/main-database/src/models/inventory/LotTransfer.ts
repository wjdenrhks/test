import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Employee} from "../base-info/Employee";
import {DateTime} from "@simplism/core";
import {Goods} from "../base-info/Goods";
import {LotHistory} from "./LotHistory";

@Table({description: "LOT 전환"})
export class LotTransfer {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "기존 LOT"})
  public fromLotId!: number;

  @Column({description: "신규 LOT"})
  public toLotId!: number;

  @Column({description: "품목 아이디"})
  public goodId!: number;

  @Column({description: "사유", nullable: true})
  public remark?: string;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  @Column({description: "등록사원"})
  public createdByEmployeeId!: number;

  @Column({description: "취소"})
  public isCanceled!: boolean;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodId", () => Goods, "이동품목")
  public goods?: Goods;

  @ForeignKey("fromLotId", () => LotHistory, "기존LOT")
  public fromLot?: LotHistory;

  @ForeignKey("toLotId", () => LotHistory, "신규LOT")
  public toLot?: LotHistory;

  @ForeignKey("createdByEmployeeId", () => Employee, "처리사원")
  public employee?: Employee;
}