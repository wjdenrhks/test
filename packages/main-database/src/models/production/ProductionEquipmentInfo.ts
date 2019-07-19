import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {DateTime} from "@simplism/core";
import {Goods, LotHistory, ProductionItem} from "../..";

@Table({description: "생산 설비 수치정보"})
export class ProductionEquipmentInfo {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "생산항목 아이디"})
  public productionId!: number;

  @Column({description: "LOT 아이디"})
  public lotId!: number;

  @Column({description: "품목 아이디"})
  public goodId!: number;

  @Column({description: "생산항목별 순서"})
  public seq?: number;

  @Column({description: "수지압력", dataType: "DECIMAL(17,6)", nullable: true})
  public numericalPressure?: number;

  @Column({description: "수지온도", dataType: "DECIMAL(17,6)", nullable: true})
  public numericalTemperature?: number;

  @Column({description: "라인스피드", dataType: "DECIMAL(17,6)", nullable: true})
  public lineSpeed?: number;

  @Column({description: "압력", dataType: "DECIMAL(17,6)", nullable: true})
  public pressure?: number;

  @Column({description: "RPM", dataType: "DECIMAL(17,6)", nullable: true})
  public rpm?: number;

  @Column({description: "장력 및 Over", dataType: "DECIMAL(17,6)", nullable: true})
  public tension?: number;

  @Column({description: "Min알람", dataType: "DECIMAL(17,6)", nullable: true})
  public min?: number;

  @Column({description: "입력시간"})
  public createdAtDateTime!: DateTime;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("productionId", () => ProductionItem, "생산항목")
  public production?: ProductionItem;

  @ForeignKey("goodId", () => Goods, "제품")
  public goods?: Goods;

  @ForeignKey("lotId", () => LotHistory, "LOT")
  public lot?: LotHistory;

  //------------------------------------

}