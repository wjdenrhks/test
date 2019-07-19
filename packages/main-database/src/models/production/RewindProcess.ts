import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Employee} from "../base-info/Employee";
import {DateOnly, DateTime} from "@simplism/core";
import {
  BaseType,
  Equipment,
  Goods,
  LotHistory, ProductionItem, Scrap, Stock
} from "../..";

@Table({description: "리와인더"})
export class RewindProcess {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "작업 계획일"})
  public planDate!: DateOnly;

  @Column({description: "작업 시각일", nullable: true})
  public startDate?: DateOnly;

  @Column({description: "설비 아이디"})
  public equipmentId!: number;

  @Column({description: "구분"})
  public type!: "외주" | "사내";

  @Column({description: "품목 아이디"})
  public goodId!: number;

  @Column({description: "타공품 아이디", nullable: true})
  public changeGoodId?: number;

  @Column({description: "생산항목 아이디", nullable: true})
  public productionId?: number;

  @Column({description: "재고 아이디", nullable: true})
  public stockId?: number;

  @Column({description: "생산 LOT", nullable: true})
  public productionLotId?: number;

  @Column({description: "리와인더 코드", nullable: true})
  public code?: string;

  @Column({description: "코드 순서", nullable: true})
  public codeSeq?: number;

  @Column({description: "리와인더 LOT", nullable: true})
  public rewindLotId?: number;

  @Column({description: "코드별 Lot 순서", nullable: true})
  public lotSeq?: number;

  @Column({description: "커팅 규격", nullable: true})
  public cuttingSpecification?: string;

  @Column({description: "작업구분", nullable: true})
  public productionType?: "내면 코로나 처리" | "외면 코로나 처리" | "커팅" | "중타(커팅)" | "타공" | "검수" | "재감기" | "내면박리" | "외면박리";

  @Column({description: "제품구분", nullable: true})
  public goodType?: "완제품" | "반제품" | "보류품" | "폐기품(재생)" | "폐기품(폐기)" | "폐기품(매각)";

  @Column({description: "투입수량(kg)", nullable: true})
  public inputQuantity?: number;

  @Column({description: "투입수량(m)", nullable: true})
  public inputWeight?: number;

  @Column({description: "작업수량", nullable: true})
  public productionQuantity?: number;

  @Column({description: "제품중량", nullable: true})
  public productionWeight?: number;

  @Column({description: "코로나(다인)", nullable: true})
  public corona?: "38" | "40" | "42" | "44" | "46";

  @Column({description: "수축(값)", nullable: true})
  public shrink?: number;

  @Column({description: "외관검사", nullable: true})
  public visualInspectionType?: "OK" | "NG" | "주름" | "라인줄" | "알갱이" | "접힘" | "펑크";

  @Column({description: "등급", nullable: true})
  public rating?: "A" | "B" | "C" | "공통";

  @Column({description: "스크랩 아이디", nullable: true})
  public scrapId?: number;

  @Column({description: "스크랩 품목 아이디", nullable: true})
  public scrapGoodId?: number;

  @Column({description: "스크랩유형", nullable: true})
  public scrapCategoryId?: number;

  @Column({description: "스크랩 구분", nullable: true})
  public scrapType?: "재생 가능" | "재생 불가" | "보류";

  @Column({description: "LOSS(M)", dataType: "DECIMAL(17,6)", nullable: true})
  public lossQuantity?: number;

  @Column({description: "LOSS(KG)", dataType: "DECIMAL(17,6)", nullable: true})
  public lossWeight?: number;

  @Column({description: "라인스피드", dataType: "DECIMAL(17,6)", nullable: true})
  public lineSpeed?: number;

  @Column({description: "텐션값", dataType: "DECIMAL(17,6)", nullable: true})
  public tension?: number;

  @Column({description: "ERP리와인더 아이디", nullable: true})
  public erpSyncCode?: number;

  @Column({description: "생산시작시간", nullable: true})
  public firstModifyDate?: DateTime;

  @Column({description: "생산시간", nullable: true})
  public modifyDate?: DateTime;

  @Column({description: "생산종료시간", nullable: true})
  public lastModifyDate?: DateTime;

  @Column({description: "작업자 아이디"})
  public createdByEmployeeId!: number;

  @Column({description: "등록시간"})
  public createdAtDateTime!: DateTime;

  @Column({description: "취소"})
  public isCanceled!: boolean;

  @Column({description: "ERP 생산지시", nullable: true})
  public ssMakeOrderId?: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("equipmentId", () => Equipment, "설비")
  public equipments?: Equipment;

  @ForeignKey("stockId", () => Stock, "생산품 재고")
  public productStock?: Stock;

  @ForeignKey("goodId", () => Goods, "제품")
  public goods?: Goods;

  @ForeignKey("scrapGoodId", () => Goods, "스크랩 품목")
  public scrapGood?: Goods;

  @ForeignKey("scrapCategoryId", () => BaseType, "스크랩유형")
  public scrapCategory?: BaseType;

  @ForeignKey("changeGoodId", () => Goods, "타공품")
  public changeGoods?: Goods;

  @ForeignKey("scrapId", () => Scrap, "스크랩")
  public scrap?: Scrap;

  @ForeignKey("productionId", () => ProductionItem, "생산항목")
  public production?: ProductionItem;

  @ForeignKey("productionLotId", () => LotHistory, "생산 LOT")
  public productionLot?: LotHistory;

  @ForeignKey("rewindLotId", () => LotHistory, "리와인더 LOT")
  public rewindLot?: LotHistory;

  @ForeignKey("createdByEmployeeId", () => Employee, "작업자")
  public createdByEmployee?: Employee;

  //------------------------------------

}