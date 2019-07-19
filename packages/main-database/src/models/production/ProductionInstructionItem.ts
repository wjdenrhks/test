import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {
  Goods

} from "../..";


@Table({description: "생산지시 항목"})
export class ProductionInstructionItem {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "생산지시 아이디"})
  public productionInstructionid?: number;

  @Column({description: "품목 아이디"})
  public goodId!: number;

  @Column({description: "예상 소요량", nullable: true, dataType: "DECIMAL(17,6)"})
  public expectationQuantity?: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

  //------------------------------------

}