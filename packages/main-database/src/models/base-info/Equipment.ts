import {Company} from "./Company";
import {Column, ForeignKey, ForeignKeyTarget, Table} from "@simplism/orm-query";
import {DateTime} from "@simplism/core";
import {Employee} from "./Employee";
import {RepairByEquipment} from "./RepairByEquipment";
import {EquipmentStopInfo} from "./EquipmentStopInfo";
import {EquipmentByEquipment} from "./EquipmentByEquipment";


@Table({description: "설비"})
export class Equipment {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "순서"})
  public seq!: number;

  @Column({description: "관리번호", nullable: true})
  public code?: string;

  @Column({description: "설비코드", nullable: true})
  public equipmentCode?: string;

  @Column({description: "명칭"})
  public name!: string;

  @Column({description: "집계"})
  public isCount!: boolean;

  @Column({description: "사용중지"})
  public isDisabled!: boolean;

  @Column({description: "등록자", nullable: true})
  public createdByEmployeeId?: number;

  @Column({description: "등록일"})
  public createdAtDateTime!: DateTime;

  @Column({description: "수정사원", nullable: true})
  public modifyByEmployeeId?: number;

  @Column({description: "수정일", nullable: true})
  public modifyAtDateTime?: DateTime;

  @Column({description: "ERP 연동코드"})
  public erpSyncCode!: number;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("createdByEmployeeId", () => Employee, "작업자")
  public employee?: Employee;

  @ForeignKey("modifyByEmployeeId", () => Employee, "수정작업자")
  public modifyEmployee?: Employee;

  //------------------------------------

  @ForeignKeyTarget(() => RepairByEquipment, "equipment", "설비별 수리 이력")
  public repair?: RepairByEquipment[];

  @ForeignKeyTarget(() => EquipmentByEquipment, "equipment", "설비별 설비 이력")
  public equipmentByEquipment?: EquipmentByEquipment[];

  @ForeignKeyTarget(() => EquipmentStopInfo, "equipment", "설비별 비가동 이력")
  public stop?: EquipmentStopInfo[];
}