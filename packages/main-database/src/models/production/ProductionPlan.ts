import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Employee} from "../base-info/Employee";
import {DateTime} from "@simplism/core";
import {Goods} from "../base-info/Goods";
import {Partner} from "../..";
import {ProductionPlanItem} from "./ProductionPlanItem";

@Table({description: "생산계획"})
export class ProductionPlan {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "품목"})
  public goodsId!: number;

  @Column({description: "두께", nullable: true})
  public thick?: number;

  @Column({description: "년", nullable: true})
  public year?: number;

  @Column({description: "월", nullable: true})
  public month?: number;

  @Column({description: "주", nullable: true})
  public week?: number;

  @Column({description: "거래처 아이디"})
  public partnerId!: number;

  @Column({description: "계획수량", dataType: "DECIMAL(17,6)"})
  public quantity!: number;

  @Column({description: "단가", nullable: true})
  public unitPrice?: number;

  @Column({description: "실제생산량", nullable: true, dataType: "DECIMAL(17,6)"})
  public productionQuantity?: number;

  @Column({description: "비고", nullable: true})
  public remark?: string;

  @Column({description: "작성자 아이디"})
  public createdByEmployeeId!: number;

  @Column({description: "작성일시"})
  public createdAtDateTime!: DateTime;

  @Column({description: "수정자 아이디", nullable: true})
  public modifyByEmployeeId?: number;

  @Column({description: "수정일시", nullable: true})
  public modifyAtDateTime?: DateTime;

  @Column({description: "취소"})
  public isDisabled!: boolean;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodsId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("partnerId", () => Partner, "거래처")
  public partner?: Partner;

  @ForeignKey("createdByEmployeeId", () => Employee, "작성자")
  public employee?: Employee;

  @ForeignKey("modifyByEmployeeId", () => Employee, "수정자")
  public modifyEmployee?: Employee;

  //------------------------------------

  @ForeignKeyTarget(() => ProductionPlanItem, "plan", "생산계획 목록")
  public items?: ProductionPlanItem[];
}