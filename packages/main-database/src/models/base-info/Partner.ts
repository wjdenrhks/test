import {Company} from "./Company";
import {Column, ForeignKey, Table} from "@simplism/orm-query";
import {DateTime} from "@simplism/core";

@Table({description: "업체"})
export class Partner {
  @Column({description: "업체", primaryKey: 1, autoIncrement: true})
  public id?: number;

  @Column({description: "회사 아이디"})
  public companyId!: number;

  @Column({description: "명칭"})
  public name!: string;

  @Column({description: "거래처 코드", nullable: true})
  public partnerCode?: string;

  @Column({description: "대표자명", nullable: true})
  public representative?: string;

  @Column({description: "사업자등록번호", nullable: true})
  public registrationNumber?: string;

  @Column({description: "법인등록번호", nullable: true})
  public businessRegistrationNumber?: string;

  @Column({description: "전화번호", nullable: true})
  public tel?: string;

  @Column({description: "휴대폰번호", nullable: true})
  public phoneNumber?: string;

  @Column({description: "팩스번호", nullable: true})
  public faxNumber?: string;

  @Column({description: "이메일", nullable: true})
  public emailAddress?: string;

  @Column({description: "홈페이지", nullable: true})
  public homePage?: string;

  @Column({description: "업태", nullable: true})
  public businessConditions?: string;

  @Column({description: "종목", nullable: true})
  public event?: string;

  @Column({description: "주소", nullable: true})
  public address?: string;

  @Column({description: "상세주소", nullable: true})
  public addressDetail?: string;

  @Column({description: "우편번호", nullable: true})
  public postcode?: string;

  @Column({description: "개인,법인", nullable: true})
  public companyType?: string;

  @Column({description: "구분 아이디", nullable: true})
  public type?: "매입처" | "매출처" | "본사";

  @Column({description: "수출업체 여부", nullable: true})
  public isExport?: boolean;

  @Column({description: "사용중지 여부"})
  public isDisabled!: boolean;

  @Column({description: "ERP 연동코드", nullable: true})
  public erpSyncCode?: number;

  @Column({description: "등록일", nullable: true})
  public createdAtDateTime!: DateTime;

  @Column({description: "비고", nullable: true})
  public remark?: string;

  @Column({description: "담당자", nullable: true})
  public inCharge?: string;

  //------------------------------------

  @ForeignKey("companyId", () => Company, "회사")
  public company?: Company;

}