import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Equipment} from "../base-info/Equipment";
import {Employee} from "../base-info/Employee";
import {DateTime} from "@simplism/core";
import {Goods, ProductionInstruction, QuantityCheckInspection, Scrap} from "../..";
import {ProductionItem} from "./ProductionItem";

@Table({description: "생산실적"})
export class Production {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "생산지시 아이디"})
  public instructionId!: number;

  @Column({description: "생산지시 코드", nullable: true})
  public productionOrderCode?: string;

  @Column({description: "설비"})
  public equipmentId!: number;

  @Column({description: "제품"})
  public goodId!: number;

  @Column({description: "생산지시 수량", dataType: "DECIMAL(17,6)"})
  public orderQuantity!: number;

  @Column({description: "상태", nullable: true})
  public status?: string;

  @Column({description: "QC검사", nullable: true})
  public inspectionId?: number;

  @Column({description: "밀어내기 LOSS", nullable: true, dataType: "DECIMAL(17,6)"})
  public pushLoss?: number;

  @Column({description: "작업일시"})
  public createdAtDateTime!: DateTime;

  @Column({description: "작업자 아이디"})
  public createdByEmployeeId!: number;

  @Column({description: "취소여부"})
  public isCanceled!: boolean;

  @Column({description: "생산 준비 일시", nullable: true})
  public productionReadyModifiedAtDateTime?: DateTime;

  @Column({description: "생산 시작 일시", nullable: true})
  public firstModifiedAtDateTime?: DateTime;

  @Column({description: "수기 생산 종료 일시", nullable: true})
  public lastHandModifiedAtDateTime?: DateTime;

  @Column({description: "생산 종료 일시", nullable: true})
  public lastModifiedAtDateTime?: DateTime;

  @Column({description: "생산완료 여부"})
  public isCompletion!: boolean;

  @Column({description: "수정자 아이디", nullable: true})
  public modifyByEmployeeId?: number;

  @Column({description: "수정일시", nullable: true})
  public modifyAtDateTime?: DateTime;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("instructionId", () => ProductionInstruction, "생산지시")
  public instruction?: ProductionInstruction;

  @ForeignKey("equipmentId", () => Equipment, "설비")
  public equipment?: Equipment;

  @ForeignKey("goodId", () => Goods, "제품")
  public goods?: Goods;

  @ForeignKey("inspectionId", () => QuantityCheckInspection, "QC검사")
  public inspection?: QuantityCheckInspection;

  @ForeignKey("createdByEmployeeId", () => Employee, "작업자")
  public createdByEmployee?: Employee;

  @ForeignKey("modifyByEmployeeId", () => Employee, "수정자")
  public modifyEmployee?: Employee;

  //------------------------------------

  @ForeignKeyTarget(() => ProductionItem, "production", "생산 목록")
  public productionItem?: ProductionItem[];

  @ForeignKeyTarget(() => Scrap, "production", "스크랩 목록")
  public scrap?: Scrap[];
}