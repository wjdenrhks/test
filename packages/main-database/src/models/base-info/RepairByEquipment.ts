import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {DateOnly, DateTime} from "@simplism/core";
import {Equipment} from "./Equipment";
import {Employee} from "./Employee";

@Table({description: "설비별 수리 이력"})
export class RepairByEquipment {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "설비 아이디"})
  public equipmentId!: number;

  @Column({description: "일자"})
  public dueDate!: DateOnly;

  @Column({description: "내용", nullable: true})
  public remark?: string;

  @Column({description: "결과", nullable: true})
  public result?: string;

  @Column({description: "금액", nullable: true})
  public price?: string;

  @Column({description: "등록시간", nullable: true})
  public createdAtDateTime?: DateTime;

  @Column({description: "등록자"})
  public createdByEmployeeId!: number;

  @Column({description: "수정시간", nullable: true})
  public modifyAtDateTime?: DateTime;

  @Column({description: "수정자", nullable: true})
  public modifyByEmployeeId?: number;

  //------------------------------------

  @ForeignKey("equipmentId", () => Equipment, "설비")
  public equipment?: Equipment;

  @ForeignKey("createdByEmployeeId", () => Employee, "등록자")
  public employee?: Employee;

  @ForeignKey("modifyByEmployeeId", () => Employee, "수정자")
  public modifyEmployee?: Employee;
}