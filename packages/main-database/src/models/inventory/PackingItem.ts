import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Employee} from "../base-info/Employee";
import {DateTime} from "@simplism/core";
import {Goods} from "../base-info/Goods";
import {LotHistory} from "./LotHistory";
import {Packing} from "./Packing";
import {Stock} from "./Stock";

@Table({description: "LOT 리스트"})
export class PackingItem {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "리스트 순서", nullable: true})
  public seq?: number;

  @Column({description: "팔레트 아이디"})
  public packingId!: number;

  @Column({description: "LOT"})
  public lotId!: number;

  @Column({description: "재고 아이디", nullable: true})
  public stockId?: number;

  @Column({description: "품목 아이디"})
  public goodId!: number;

  @Column({description: "사용여부"})
  public isDisabled!: boolean;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  @Column({description: "등록사원"})
  public createdByEmployeeId!: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("stockId", () => Stock, "재고")
  public stock?: Stock;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("packingId", () => Packing, "팔레트")
  public packing?: Packing;

  @ForeignKey("lotId", () => LotHistory, "LOT")
  public lot?: LotHistory;

  @ForeignKey("createdByEmployeeId", () => Employee, "처리사원")
  public employee?: Employee;
}