import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Employee} from "../base-info/Employee";
import {DateTime} from "@simplism/core";
import {
  Goods,
  LotHistory,
  PackingItem,
  Production,
  ProductionWeight,
  QuantityCheckInspectionItem, RewindProcess,
  Warehouse
} from "../..";

@Table({description: "생산 내역"})
export class ProductionItem {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "생산 아이디"})
  public productionId!: number;

  @Column({description: "생산조"})
  public productionGroup?: "A" | "B";

  @Column({description: "품목 아이디"})
  public goodId!: number;

  @Column({description: "LOT", nullable: true})
  public lotId?: number;

  @Column({description: "LOT 순서", nullable: true})
  public lotSeq?: number;

  @Column({description: "설비 생산 순서", nullable: true})
  public equipmentSeq?: number;

  @Column({description: "폭", nullable: true})
  public width?: string;

  @Column({description: "두께", dataType: "DECIMAL(17,6)", nullable: true})
  public thickness?: number;

  @Column({description: "길이", dataType: "DECIMAL(17,6)", nullable: true})
  public length?: number;

  @Column({description: "중량", dataType: "DECIMAL(17,6)", nullable: true})
  public weight?: number;

  @Column({description: "내면", dataType: "DECIMAL(17,6)", nullable: true})
  public inside?: number;

  @Column({description: "외면", dataType: "DECIMAL(17,6)", nullable: true})
  public outSide?: number;

  @Column({description: "최하", dataType: "DECIMAL(17,6)", nullable: true})
  public theMinimum?: number;

  @Column({description: "최상", dataType: "DECIMAL(17,6)", nullable: true})
  public theBest?: number;

  @Column({description: "평균", dataType: "DECIMAL(17,6)", nullable: true})
  public average?: number;

  @Column({description: "MD", dataType: "DECIMAL(17,6)", nullable: true})
  public md?: number;

  @Column({description: "TD", dataType: "DECIMAL(17,6)", nullable: true})
  public td?: number;

  @Column({description: "수지압력", dataType: "DECIMAL(17,6)", nullable: true})
  public numericalPressure?: number;

  @Column({description: "수지온도", dataType: "DECIMAL(17,6)", nullable: true})
  public numericalTemperature?: number;

  @Column({description: "압력", dataType: "DECIMAL(17,6)", nullable: true})
  public pressure?: number;

  @Column({description: "토출량(내층)", dataType: "DECIMAL(17,6)", nullable: true})
  public insiderLayer?: number;

  @Column({description: "토출량(중층)", dataType: "DECIMAL(17,6)", nullable: true})
  public middleLayer?: number;

  @Column({description: "토출량(외층)", dataType: "DECIMAL(17,6)", nullable: true})
  public outerLayer?: number;

  @Column({description: "RPM(내층)", dataType: "DECIMAL(17,6)", nullable: true})
  public insideRpm?: number;

  @Column({description: "RPM(중층)", dataType: "DECIMAL(17,6)", nullable: true})
  public middleRpm?: number;

  @Column({description: "RPM(외층)", dataType: "DECIMAL(17,6)", nullable: true})
  public outSideRpm?: number;

  @Column({description: "라인스피드", dataType: "DECIMAL(17,6)", nullable: true})
  public lineSpeed?: number;

  @Column({description: "텐션", dataType: "DECIMAL(17,6)", nullable: true})
  public tension?: number;

  @Column({description: "수지온도(외층)", dataType: "DECIMAL(17,6)", nullable: true})
  public outsideTemperature?: number;

  @Column({description: "수지온도(내층)", dataType: "DECIMAL(17,6)", nullable: true})
  public insideTemperature?: number;

  @Column({description: "수지온도(중층)", dataType: "DECIMAL(17,6)", nullable: true})
  public middleTemperature?: number;

  @Column({description: "수지압력(외층)", dataType: "DECIMAL(17,6)", nullable: true})
  public outSidePressure?: number;

  @Column({description: "수지압력(중층)", dataType: "DECIMAL(17,6)", nullable: true})
  public middlePressure?: number;

  @Column({description: "수지압력(내층)", dataType: "DECIMAL(17,6)", nullable: true})
  public insidePressure?: number;

  @Column({description: "처리기 A", dataType: "DECIMAL(17,6)", nullable: true})
  public processorA?: number;

  @Column({description: "처리기 B", dataType: "DECIMAL(17,6)", nullable: true})
  public processorB?: number;

  @Column({description: "Min알람", dataType: "DECIMAL(17,6)", nullable: true})
  public min?: number;

  @Column({description: "C-1", nullable: true})
  public remarkC1?: string;

  @Column({description: "C-2", nullable: true})
  public remarkC2?: string;

  @Column({description: "등급", nullable: true})
  public rating?: "A" | "B" | "C" | "공통";

  @Column({description: "불량", nullable: true})
  public defectType?: "주름" | "펑크" | "알갱이" | "접힘" | "젤" | "칼빠짐" | "미터부족" | "기포" | "두께편차" | "PE뜯김" | "라인줄" | "수축" | "접착" | "중량" | "코로나";

  @Column({description: "창고 아이디", nullable: true})
  public warehouseId?: number;

  @Column({description: "중량측정 아이디", nullable: true})
  public weightMeasurementId?: number;

  @Column({description: "포장바코드 아이디", nullable: true})
  public packingId?: number;

  @Column({description: "리와인더 아이디", nullable: true})
  public rewindId?: number;

  @Column({description: "검사 아이디", nullable: true})
  public inspectionId?: number;

  @Column({description: "생산시작 시간", nullable: true})
  public firstProductionDateTime?: DateTime;

  @Column({description: "생산 시간", nullable: true})
  public modifyDateTime?: DateTime;

  @Column({description: "수기 생산종료 시간", nullable: true})
  public lastHandModifiedAtDateTime?: DateTime;

  @Column({description: "생산종료 시간", nullable: true})
  public lastProductionDateTime?: DateTime;

  @Column({description: "등록자 아이디"})
  public createdByEmployeeId!: number;

  @Column({description: "등록 시간"})
  public createdAtDateTime!: DateTime;

  @Column({description: "ERP생산지시 아이디", nullable: true})
  public ssMakeOrderKey?: number;

  @Column({description: "ERP생산항목 아이디", nullable: true})
  public ssMakeProductKey?: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("productionId", () => Production, "생산")
  public production?: Production;

  @ForeignKey("goodId", () => Goods, "제품")
  public goods?: Goods;

  @ForeignKey("warehouseId", () => Warehouse, "창고")
  public warehouse?: Warehouse;

  @ForeignKey("weightMeasurementId", () => ProductionWeight, "중량측정")
  public weightMeasurement?: ProductionWeight;

  @ForeignKey("rewindId", () => RewindProcess, "리와인더")
  public rewind?: RewindProcess;

  @ForeignKey("inspectionId", () => QuantityCheckInspectionItem, "검사항목")
  public inspection?: QuantityCheckInspectionItem;

  @ForeignKey("packingId", () => PackingItem, "포장 바코드")
  public packing?: PackingItem;

  @ForeignKey("lotId", () => LotHistory, "LOT")
  public lot?: LotHistory;

  @ForeignKey("createdByEmployeeId", () => Employee, "작업자")
  public createdByEmployee?: Employee;

  //------------------------------------

}