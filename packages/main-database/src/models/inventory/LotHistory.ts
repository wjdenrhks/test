import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Employee} from "../base-info/Employee";
import {DateTime} from "@simplism/core";
import {Goods} from "../base-info/Goods";
import {Equipment, LotTransfer, Production, ProductionItem, Warehouse} from "../..";

@Table({description: "LOT 기록"})
export class LotHistory {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "타입", nullable: true})
  public type?: "생산" | "입고" | "반품" | "출고" | "기타";

  @Column({description: "설비", nullable: true})
  public equipmentId?: number;

  @Column({description: "생산 아이디", nullable: true})
  public productionId?: number;

  @Column({description: "생산항목 아이디", nullable: true})
  public productionItemId?: number;

  @Column({description: "설비 생산 순서", nullable: true})
  public equipmentSeq?: number;

  @Column({description: "리와인더 아이디", nullable: true})
  public rewindId?: number;

  @Column({description: "창고"})
  public warehouseId!: number;

  @Column({description: "발급 LOT"})
  public lot!: string;

  @Column({description: "프린트 LOT"})
  public printLot!: string;

  @Column({description: "발급 순서"})
  public seq!: number;

  @Column({description: "품목 아이디"})
  public goodId!: number;

  @Column({description: "길이", dataType: "DECIMAL(17,6)", nullable: true})
  public length?: number;

  @Column({description: "중량", dataType: "DECIMAL(17,6)", nullable: true})
  public weight?: number;

  @Column({description: "폭", nullable: true})
  public width?: string;

  @Column({description: "두께", dataType: "DECIMAL(17,6)", nullable: true})
  public thick?: number;

  @Column({description: "품목 등급", nullable: true})
  public goodsRating?: "A" | "B" | "C" | "공통";

  @Column({description: "사유", nullable: true})
  public remark?: string;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  @Column({description: "등록사원"})
  public createdByEmployeeId!: number;

  @Column({description: "변환 전 LOT", nullable: true})
  public transLot?: string;

  @Column({description: "변환 LOT", nullable: true})
  public transLotId?: number;

  @Column({description: "테스트 LOT 여부"})
  public isTesting!: boolean;

  @Column({description: "재고 LOT 여부"})
  public isNotStock!: boolean;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("equipmentId", () => Equipment, "설비")
  public equipment?: Equipment;

  @ForeignKey("productionId", () => Production, "생산")
  public production?: Production;

  @ForeignKey("productionItemId", () => ProductionItem, "생산항목")
  public productionItem?: ProductionItem;

  @ForeignKey("warehouseId", () => Warehouse, "창고")
  public warehouse?: Warehouse;

  @ForeignKey("createdByEmployeeId", () => Employee, "등록사원")
  public employee?: Employee;

  //------------------------------------

  @ForeignKeyTarget(() => LotTransfer, "fromLot", "LOT 전환 목록")
  public lotTrans?: LotTransfer[];

}