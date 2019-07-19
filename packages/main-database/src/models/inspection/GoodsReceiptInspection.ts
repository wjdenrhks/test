import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {
  Company,
  Employee, GoodsReceipt, InspectionItem, LotHistory
} from "../..";
import {Goods} from "../base-info/Goods";
import {DateOnly, DateTime} from "@simplism/core";

@Table({description: "수입검사"})
export class GoodsReceiptInspection {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "검사 날짜"})
  public testDate!: DateOnly;

  @Column({description: "입고 아이디"})
  public goodsReceiptId!: number;

  @Column({description: "입고 품목"})
  public goodsId!: number;

  @Column({description: "LOT"})
  public lotId!: number;

  @Column({description: "수량", dataType: "DECIMAL(17,6)"})
  public quantity!: number;

  @Column({description: "외관(포장)", nullable: true})
  public packing?: string;

  @Column({description: "외관(중량)", nullable: true})
  public weight?: string;

  @Column({description: "외관(변형)", nullable: true})
  public deformation?: string;

  @Column({description: "MeltIndex", nullable: true})
  public meltIndex?: string;

  @Column({description: "판정", nullable: true})
  public judgment?: "합격" | "불합격";

  @Column({description: "성적서", nullable: true})
  public isReport?: Buffer;

  @Column({description: "파일정보", nullable: true})
  public reportName?: string;

  @Column({description: "취소"})
  public isDisabled!: boolean;

  @Column({description: "작성자"})
  public createdByEmployeeId!: number;

  @Column({description: "작성일"})
  public createdAtDateTime!: DateTime;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodsReceiptId", () => GoodsReceipt, "입고")
  public goodsReceipt?: GoodsReceipt;

  @ForeignKey("lotId", () => LotHistory, "LOT")
  public lot?: LotHistory;

  @ForeignKey("goodsId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("createdByEmployeeId", () => Employee, "사원")
  public employee?: Employee;

  //------------------------------------

  @ForeignKeyTarget(() => InspectionItem, "receiptInspectionItem", "항목 별 검사 정보")
  public inspectionInfo?: InspectionItem[];

}