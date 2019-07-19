import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {BaseType, Company, Employee, Goods, GoodsReceiptInspection, QuantityCheckInspectionItem} from "../..";
import {DateTime} from "@simplism/core";

@Table({description: "품질검사 항목별 검사항목"})
export class InspectionItem {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "QC검사항목 아이디", nullable: true})
  public quantityCheckInspectionItemId?: number;

  @Column({description: "수입검사항목 아이디"})
  public receiptInspectionItemId?: number;

  @Column({description: "검사 아이디"})
  public inspectionId!: number;

  @Column({description: "품목 아이디"})
  public goodId!: number;

  @Column({description: "검사값", nullable: true})
  public inspectionValue?: string;

  @Column({description: "평균중량", dataType: "DECIMAL(17,6)", nullable: true})
  public weightAvg?: number;

  @Column({description: "최소값", dataType: "DECIMAL(17,6)", nullable: true})
  public min?: number;

  @Column({description: "평균값", dataType: "DECIMAL(17,6)", nullable: true})
  public avg?: number;

  @Column({description: "최대값", dataType: "DECIMAL(17,6)", nullable: true})
  public max?: number;

  @Column({description: "표준편차 최소값", dataType: "DECIMAL(17,6)", nullable: true})
  public standardDeviationMin?: number;

  @Column({description: "표준편차 평균값", dataType: "DECIMAL(17,6)", nullable: true})
  public standardDeviationAvg?: number;

  @Column({description: "표준편차 최대값", dataType: "DECIMAL(17,6)", nullable: true})
  public standardDeviationMax?: number;

  @Column({description: "자동검사 여부", nullable: true})
  public isAutoInspection?: boolean;

  @Column({description: "차트 기준"})
  public isUsingChart!: boolean;

  @Column({description: "작성자", nullable: true })
  public createdByEmployeeId?: number;

  @Column({description: "작성일", nullable: true })
  public createdAtDateTime?: DateTime;


  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("quantityCheckInspectionItemId", () => QuantityCheckInspectionItem, "QC검사항목")
  public quantityCheckInspectionItem?: QuantityCheckInspectionItem;

  @ForeignKey("receiptInspectionItemId", () => GoodsReceiptInspection, "수입검사항목")
  public receiptInspectionItem?: GoodsReceiptInspection;

  @ForeignKey("inspectionId", () => BaseType, "검사항목")
  public inspection?: BaseType;

  @ForeignKey("createdByEmployeeId", () => Employee, "검사자")
  public employee?: Employee;

}