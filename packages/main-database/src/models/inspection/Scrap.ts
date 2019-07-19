import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {BaseType, Company, Employee, LotHistory, Production, RewindProcess} from "../..";
import {DateOnly, DateTime} from "@simplism/core";
import {Goods} from "../base-info/Goods";

@Table({description: "스크랩"})
export class Scrap {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "발생 일자"})
  public occurrenceDate!: DateOnly;

  @Column({description: "생산 아이디", nullable: true})
  public productionId?: number;

  @Column({description: "리와인더 아이디", nullable: true})
  public rewindId?: number;

  @Column({description: "LOT", nullable: true})
  public lotId?: number;

  @Column({description: "스크랩 품목 아이디"})
  public scrapGoodId!: number;

  @Column({description: "스크랩 종류", nullable: true})
  public kind!: "생산" | "밀어내기" | "재감기";

  @Column({description: "발생 Roll.No", nullable: true})
  public rollNumber?: string;

  @Column({description: "발생 중량", dataType: "DECIMAL(38,1)"})
  public weight!: number;

  @Column({description: "유형"})
  public typeId!: number;

  @Column({description: "등급", nullable: true})
  public rating?: "재생 가능" | "재생 불가" | "보류";

  @Column({description: "비고", nullable: true})
  public remark?: string;

  @Column({description: "취소 여부"})
  public isDisabled!: boolean;

  @Column({description: "작성자"})
  public createdByEmployeeId!: number;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  @Column({description: "ERP 스크랩", nullable: true})
  public ssMakeScrapId?: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("productionId", () => Production, "생산")
  public production?: Production;

  @ForeignKey("rewindId", () => RewindProcess, "리와인더")
  public rewind?: RewindProcess;

  @ForeignKey("scrapGoodId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("lotId", () => LotHistory, "LOT")
  public lot?: LotHistory;

  @ForeignKey("typeId", () => BaseType, "스크랩 유형")
  public type?: BaseType;

  @ForeignKey("createdByEmployeeId", () => Employee, "작업자")
  public employee?: Employee;
}