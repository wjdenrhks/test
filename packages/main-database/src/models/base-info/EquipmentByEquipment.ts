import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {DateTime} from "@simplism/core";
import {Equipment} from "./Equipment";
import {Employee} from "./Employee";

@Table({description: "설비별 수리 이력"})
export class EquipmentByEquipment {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "설비 아이디"})
  public equipmentId!: number;

  @Column({description: "등록시간", nullable: true})
  public createdAtDateTime?: DateTime;

  @Column({description: "등록자"})
  public createdByEmployeeId!: number;

  @Column({description: "내용", nullable: true})
  public content?: string;

  //----------------------------------
  @ForeignKey("equipmentId", () => Equipment, "설비")
  public equipment?: Equipment;

  @ForeignKey("createdByEmployeeId", () => Employee, "등록자")
  public employee?: Employee;
}