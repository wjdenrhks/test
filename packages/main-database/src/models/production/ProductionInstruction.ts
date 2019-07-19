import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Equipment} from "../base-info/Equipment";
import {DateOnly, DateTime} from "@simplism/core";
import {
  Employee, Goods, GoodsBuildList, GoodsIssuePlan, MixingProcess, Partner, Production

} from "../..";


@Table({description: "생산지시"})
export class ProductionInstruction {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "생산지시 No", nullable: true})
  public productionInstructionCode?: string;

  @Column({description: "작업조", nullable: true})
  public workingGroup?: "A" | "B";

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "거래처"})
  public partnerId!: number;

  @Column({description: "출하계획 아이디", nullable: true})
  public shippingPlanId?: number;

  @Column({description: "생산예정일"})
  public orderDate!: DateOnly;

  @Column({description: "생산지시 오더번호", nullable: true})
  public seq?: number;

  @Column({description: "품목 아이디"})
  public goodId!: number;

  @Column({description: "capa"})
  public capa!: number;

  @Column({description: "설비 아이디"})
  public equipmentId!: number;

  @Column({description: "BOM 아이디", nullable: true})
  public bomId?: number;

  @Column({description: "g(SPEC/오차)", nullable: true, dataType: "DECIMAL(17,6)"})
  public errorSpecG?: number;

  @Column({description: "㎛(SPEC/오차)", nullable: true, dataType: "DECIMAL(17,6)"})
  public errorSpecM?: number;

  @Column({description: "코로나(양,단)", nullable: true})
  public corona?: "양면" | "단면";

  @Column({description: "코로나 다인", nullable: true})
  public coronaDain?: string;

  @Column({description: "롤길이", nullable: true, dataType: "DECIMAL(17,6)"})
  public rollLength?: number;

  @Column({description: "생산량(Roll)", nullable: true, dataType: "DECIMAL(17,6)"})
  public productQuantity?: number;

  @Column({description: "제품중량", nullable: true, dataType: "DECIMAL(17,6)"})
  public productWeight?: number;

  @Column({description: "롤중량",  nullable: true, dataType: "DECIMAL(17,6)"})
  public rollWeight?: number;

  @Column({description: "지관",  nullable: true, dataType: "DECIMAL(17,6)"})
  public branchWeight?: number;

  @Column({description: "포장재",  nullable: true, dataType: "DECIMAL(17,6)"})
  public packingWeight?: number;

  @Column({description: "PAD",  nullable: true, dataType: "DECIMAL(17,6)"})
  public padWeight?: number;

  @Column({description: "특이사항",  nullable: true})
  public remark?: string;

  @Column({description: "작성자 아이디"})
  public createdByEmployeeId!: number;

  @Column({description: "작성일시"})
  public createdAtDateTime!: DateTime;

  @Column({description: "수정자 아이디", nullable: true})
  public modifyByEmployeeId?: number;

  @Column({description: "수정일시", nullable: true})
  public modifyAtDateTime?: DateTime;

  @Column({description: "생산 종료 일시", nullable: true})
  public lastModifiedAtDateTime?: DateTime;

  @Column({description: "배합처리 여부", nullable: true})
  public isCombination?: number;

  @Column({description: "생산 아이디", nullable: true})
  public isProduction?: number;

  @Column({description: "취소여부"})
  public isCanceled!: boolean;

  @Column({description: "ERP생산지시 아이디", nullable: true})
  public ssMakeOrderId?: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("partnerId", () => Partner, "거래처")
  public partners?: Partner;

  @ForeignKey("equipmentId", () => Equipment, "설비")
  public equipment?: Equipment;

  @ForeignKey("shippingPlanId", () => GoodsIssuePlan, "출하계획")
  public shippingPlan?: GoodsIssuePlan;

  @ForeignKey("isProduction", () => Production, "생산")
  public production?: Production;

  @ForeignKey("bomId", () => GoodsBuildList, "BOM 정보")
  public bom?: GoodsBuildList;

  @ForeignKey("createdByEmployeeId", () => Employee, "작성자")
  public employee?: Employee;

  @ForeignKey("isCombination", () => MixingProcess, "배합")
  public combination?: MixingProcess;

  @ForeignKey("modifyByEmployeeId", () => Employee, "작성자")
  public modifyEmployee?: Employee;
  //------------------------------------
}