import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Employee} from "../base-info/Employee";
import {DateOnly, DateTime} from "@simplism/core";
import {Goods, LotHistory} from "../..";
import {ProductionItem} from "./ProductionItem";

@Table({description: "생산 내역"})
export class ProductionWeight {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "측정일"})
  public dueDate!: DateOnly;

  @Column({description: "생산항목 아이디"})
  public productionItemId!: number;

  @Column({description: "품목 아이디"})
  public goodId!: number;

  @Column({description: "LOT", nullable: true})
  public lotId?: number;

  @Column({description: "실제중량", dataType: "DECIMAL(17,6)", nullable: true})
  public realWeight?: number;

  @Column({description: "등록사원 아이디", nullable: true})
  public createdByEmployeeId?: number;

  @Column({description: "등록시간", nullable: true})
  public createdAtDateTime?: DateTime;

  @Column({description: "바코드 출력", nullable: true})
  public printBarcodeDatTime?: DateTime;

  @Column({description: "취소"})
  public isDisabled!: boolean;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("productionItemId", () => ProductionItem, "생산 항목")
  public productionItem?: ProductionItem;

  @ForeignKey("goodId", () => Goods, "제품")
  public goods?: Goods;

  @ForeignKey("lotId", () => LotHistory, "LOT")
  public lot?: LotHistory;

  @ForeignKey("createdByEmployeeId", () => Employee, "작업자")
  public createdByEmployee?: Employee;

  //------------------------------------

}