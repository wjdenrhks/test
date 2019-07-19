
import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {
  Company, Employee, Goods, InspectionItem, LotHistory, ProductionItem,
  QuantityCheckInspection
} from "../..";
import {DateOnly, DateTime} from "@simplism/core";

@Table({description: "QC검사 항목"})
export class QuantityCheckInspectionItem {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "검사 날짜"})
  public testDate!: DateOnly;

  @Column({description: "QC검사 아이디"})
  public instructionId!: number;

  @Column({description: "생산항목 아이디", nullable: true})
  public productionItemId?: number;

  @Column({description: "품목"})
  public goodsId!: number;

  @Column({description: "LOT", nullable: true})
  public lotId?: number;

  @Column({description: "두께", dataType: "DECIMAL(17,6)", nullable: true})
  public width?: number;

  @Column({description: "검수인", nullable: true})
  public coronerEmployeeId?: number;

  @Column({description: "검사결과", nullable: true})
  public rating?: "A" | "B" | "C" | "공통";

  @Column({description: "합/불", nullable: true})
  public isPass?: "합격" | "불합격";

  @Column({description: "비고", nullable: true})
  public remark?: string;

  @Column({description: "자동판정", nullable: true})
  public isAutoInspection?: boolean;

  @Column({description: "판정인", nullable: true})
  public judgmentEmployeeId?: number;

  @Column({description: "취소"})
  public isDisabled!: boolean;

  @Column({description: "작성일"})
  public createdAtDateTime!: DateTime;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("instructionId", () => QuantityCheckInspection, "QC검사")
  public quantityCheckInspection?: QuantityCheckInspection;
  
  @ForeignKey("productionItemId", () => ProductionItem, "생산항목")
  public productionItem?: ProductionItem;

  @ForeignKey("goodsId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("lotId", () => LotHistory, "LOT")
  public lot?: LotHistory;

  @ForeignKey("coronerEmployeeId", () => Employee, "사원")
  public coronerEmployee?: Employee;

  @ForeignKey("judgmentEmployeeId", () => Employee, "사원")
  public judgmentEmployee?: Employee;

  //------------------------------------

  @ForeignKeyTarget(() => InspectionItem, "quantityCheckInspectionItem", "항목 별 검사 정보")
  public inspectionInfo?: InspectionItem[];
}