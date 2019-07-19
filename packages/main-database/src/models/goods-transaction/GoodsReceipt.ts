import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {DateTime} from "@simplism/core";
import {
  BaseType,
  Company,
  Employee,
  Goods,
  GoodsReceiptInspection, LotHistory,
  Partner,
  QuantityCheckInspection,
  Warehouse
} from "../..";

@Table({description: "입고"})
export class GoodsReceipt {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "입고 No", nullable: true})
  public code?: string;

  @Column({description: "입고 No.seq", nullable: true})
  public codeSeq?: number;

  @Column({description: "발주ID", nullable: true})
  public purchaseId?: number;

  @Column({description: "입고일"})
  public dueDate!: DateTime;

  @Column({description: "거래처"})
  public partnerId!: number;

  @Column({description: "제품 아이디"})
  public goodId!: number;

  @Column({description: "단위별 중량", dataType: "DECIMAL(17,6)", nullable: true})
  public unitWeight?: number;

  @Column({description: "수량", dataType: "DECIMAL(17,6)"})
  public quantity!: number;

  @Column({description: "단가", nullable: true, dataType: "DECIMAL(17,6)"})
  public unitPrice?: number;

  @Column({description: "구분 아이디", nullable: true})
  public typeId?: number;

  @Column({description: "비고", nullable: true})
  public remark?: string;

  @Column({description: "창고", nullable: true})
  public warehouseId?: number;

  @Column({description: "이전LOT", nullable: true})
  public previousLotId?: number;

  @Column({description: "이전LOT(수기)", nullable: true})
  public writePreviousLot?: string;

  @Column({description: "입고LOT"})
  public receiptLotId!: number;

  @Column({description: "수입검사 아이디", nullable: true})
  public receiptInspectionId?: number;

  @Column({description: "QC 아이디", nullable: true})
  public qcInspectionId?: number;

  @Column({description: "취소"})
  public isDisabled!: boolean;

  @Column({description: "불합격여부"})
  public needCanceled!: boolean;

  @Column({description: "ERP입고 아이디", nullable: true})
  public erpSync?: number;

  @Column({description: "작성자"})
  public createdByEmployeeId!: number;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("partnerId", () => Partner, "거래처")
  public partner?: Partner;

  @ForeignKey("goodId", () => Goods, "입고 품목")
  public goods?: Goods;

  @ForeignKey("typeId", () => BaseType, "입고 구분")
  public type?: BaseType;

  @ForeignKey("previousLotId", () => LotHistory, "이전LOT")
  public previousLot?: LotHistory;

  @ForeignKey("receiptLotId", () => LotHistory, "입고LOT")
  public receiptLot?: LotHistory;

  @ForeignKey("createdByEmployeeId", () => Employee, "작업자")
  public employee?: Employee;

  @ForeignKey("warehouseId", () => Warehouse, "창고")
  public warehouse?: Warehouse;

  @ForeignKey("qcInspectionId", () => QuantityCheckInspection, "QC검사")
  public qcInstruction?: QuantityCheckInspection;

  @ForeignKey("receiptInspectionId", () => GoodsReceiptInspection, "수입검사")
  public receiptInstruction?: GoodsReceiptInspection;

  //------------------------------------
}