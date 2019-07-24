import {Company} from "./Company";
import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {UserGroup} from "./UserGroup";

@Table({description: "사원"})
export class Employee {
  @Column({description: "아이디", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "로그인 아이디"})
  public userId!: string;

  @Column({description: "이름"})
  public name!: string;

  @Column({description: "암호화된 비밀번호"})
  public encryptedPassword!: string;

  @Column({description: "사번(ERP ID)", nullable: true})
  public code?: string;

  @Column({description: "소속 ", nullable: true})
  public department?: string;

  @Column({description: "직책 ", nullable: true})
  public position?: string;

  @Column({description: "그룹 아이디", nullable: true})
  public groupId?: number;

  @Column({description: "성별 ", nullable: true})
  public sex?: number;

  @Column({description: "이메일주소", nullable: true})
  public emailAddress?: string;

  @Column({description: "휴대폰번호", nullable: true})
  public phoneNumber?: string;

  @Column({description: "사용중지여부"})
  public isDisabled!: boolean;

  @Column({description: "등급", nullable: true})
  public grade?: string;

  @Column({description: "전화번호", nullable: true})
  public tel?: string;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

  @ForeignKey("groupId", () => UserGroup, "그룹")
  public userGroup?: UserGroup;

  //------------------------------------

}