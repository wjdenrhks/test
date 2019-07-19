import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {Company} from "../base-info/Company";
import {Employee} from "../base-info/Employee";
import {DateOnly, DateTime} from "@simplism/core";
import {Goods} from "../base-info/Goods";
import {MixingProcess} from "./MixingProcess";
import {LotHistory} from "../..";

@Table({description: "투입이력"})
export class InputHistory {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "배합처리 아이디"})
  public mixingProcessId!: number;

  @Column({description: "투입일자"})
  public inputDate!: DateOnly;

  @Column({description: "투입이력 순서"})
  public mixingProcessSeq!: number;

  @Column({description: "차수"})
  public seq!: number;

  @Column({description: "투입층"})
  public type!: "내층" | "외층" | "중층";

  @Column({description: "품목"})
  public goodsId!: number;

  @Column({description: "LOT"})
  public lotId!: number;

  @Column({description: "포대", dataType: "DECIMAL(17,6)", nullable: true})
  public sack?: number;

  @Column({description: "중량", dataType: "DECIMAL(17,6)", nullable: true})
  public weight?: number;

  @Column({description: "투입량(kg)", dataType: "DECIMAL(17,6)", nullable: true})
  public quantity?: number;

  @Column({description: "투입량(%)", dataType: "DECIMAL(17,6)", nullable: true})
  public quantityPercent?: number;

  @Column({description: "작성자 아이디"})
  public createdByEmployeeId!: number;

  @Column({description: "작성일시"})
  public createdAtDateTime!: DateTime;

  @Column({description: "수정자 아이디", nullable: true})
  public modifyByEmployeeId?: number;

  @Column({description: "수정일시", nullable: true})
  public modifyAtDateTime?: DateTime;

  @Column({description: "ss_materials_input_key", nullable: true})
  public smiKey?: number;

  @Column({description: "ss_product_inout_key", nullable: true})
  public spiKey?: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("goodsId", () => Goods, "품목")
  public goods?: Goods;

  @ForeignKey("mixingProcessId", () => MixingProcess, "배합처리")
  public mixingProcess?: MixingProcess;

  @ForeignKey("lotId", () => LotHistory, "LOT")
  public lot?: LotHistory;

  @ForeignKey("createdByEmployeeId", () => Employee, "작성자")
  public employee?: Employee;

  @ForeignKey("modifyByEmployeeId", () => Employee, "수정자")
  public modifyEmployee?: Employee;

  //------------------------------------


}