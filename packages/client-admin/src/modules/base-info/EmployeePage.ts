import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit} from "@angular/core";
import {Employee, MainDbContext} from "@sample/main-database";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {ShowManualModal} from "../../modals/ShowManualModal";
import {Md5} from "ts-md5";

@Component({
  selector: "app-employee",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>사용자 관리</h4>
          <sd-topbar-menu (click)="onAddItemButtonClick()">
            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
            행 추가
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
            메뉴얼 보기
          </sd-topbar-menu>
                
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'사용자아이디'">
                <sd-textfield [(value)]="filter.id"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'사용자명'">
                <sd-textfield [(value)]="filter.name"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'소속'">
                <sd-textfield [(value)]="filter.department"></sd-textfield>
              </sd-form-item>
              <sd-form-item>
                <sd-checkbox [(value)]="filter.isDisabled">사용중지</sd-checkbox>
              </sd-form-item>

              <sd-form-item>
                <sd-button [type]="'submit'" [theme]="'primary'">
                  <sd-icon [icon]="'search'" [fixedWidth]="true"></sd-icon>
                  조회
                </sd-button>
              </sd-form-item>
            </sd-form>
          </sd-dock>

          <sd-dock class="sd-padding-sm-default">
            <sd-pagination [page]="pagination.page" [length]="pagination.length"
                           (pageChange)="onPageClick($event)"></sd-pagination>
          </sd-dock>

          <sd-busy-container [busy]="mainBusyCount > 0">
            <sd-dock-container>
              <sd-sheet #sheet [id]="'employee'"
                        [items]="items"
                        [trackBy]="trackByIdFn">
                <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span *ngIf="item.id">{{ item.id }}</span>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'아이디'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.userId"
                    ></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'이름'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.name"
                    ></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'비밀번호'" >
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.password" [disabled]="!!item.id" [type]="'password'" 
                    ></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'소속'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.department"
                    ></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'성별'">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.sex">
                      <sd-select-item [value]="undefined">없음</sd-select-item>
                      <sd-select-item [value]="1">남자</sd-select-item>
                      <sd-select-item [value]="2">여자</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등급'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.grade"
                    ></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'그룹명'">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.userGroupId">
                      <sd-select-item [value]="user.id" *ngFor="let user of userGroupList; trackBy: trackByMeFn">
                        {{ user.name }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'전화번호'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.tel"
                    ></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'휴대폰'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.phone"
                    ></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'이메일'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.email"
                    ></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'사용여부'" [width]="60">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-checkbox [(value)]="item.isDisabled"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class EmployeePage implements OnInit {

  public filter: IFilterVM = {
    id: undefined,
    name: undefined,
    isDisabled: false,
    department: undefined
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IEmployeeVM[] = [];
  public orgItems: IEmployeeVM[] = [];

  public userGroupList: {
    id: number;
    name: string;
  }[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {

  }

  public async ngOnInit(): Promise<void> {
    this.mainBusyCount++;
    await this._orm.connectAsync(MainDbContext, async db => {
      this.userGroupList = await db.userGroup
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId)
        ])
        .select(item => ({
          id: item.id!,
          name: item.name
        }))
        .resultAsync();
    });
    await this.onSearchFormSubmit();
    this.mainBusyCount--;
    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "사용자 정보 메뉴얼", {type: "employee"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      name: undefined,
      userId: undefined,
      password: undefined,
      department: undefined,
      position: undefined,
      userGroupId: undefined,
      userGroupName: undefined,
      sex: undefined,
      email: undefined,
      phone: undefined,
      isDisabled: false,
      grade: undefined,
      tel: undefined
    });
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.pagination.page = 0;
    this.lastFilter = Object.clone(this.filter);
    await this._search();
    this._cdr.markForCheck();
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
    this._cdr.markForCheck();
  }

  public async onSaveButtonClick(): Promise<void> {
    await this._save();
    this._cdr.markForCheck();
  }

  @HostListener("document:keydown", ["$event"])
  public async onDocumentKeydown(event: KeyboardEvent): Promise<void> {
    if ((event.key === "s" || event.key === "S") && event.ctrlKey) {
      event.preventDefault();
      await this._save();
      this._cdr.markForCheck();
    }
  }

  private async _save(): Promise<void> {

    const diffTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);
    if (diffTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    for (const diffTargetItem of diffTargets) {
      if (!diffTargetItem.userId) {
        this._toast.danger("아이디는 반드시 입력해야 합니다.");
        return;
      } else if (!diffTargetItem.name) {
        this._toast.danger("이름은 반드시 입력해야 합니다.");
        return;
      } else if (!diffTargetItem.password) {
        this._toast.danger("비밀번호는 반드시 입력해야 합니다.");
        return;
      }

    }

    this.viewBusyCount++;
    try {

      await this._orm.connectAsync(MainDbContext, async db => {

        for (const diffTarget of diffTargets) {
          if (!diffTarget!.id) {
            //insert
            console.log("insert");
            const newItem = await db.employee
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                userId: diffTarget.userId!,
                name: diffTarget.name!,
                //encryptedPassword: diffTarget.password!,
                encryptedPassword: String(new Md5().appendStr(diffTarget.password!).end()),
                department: diffTarget.department,
                position: diffTarget.position,
                groupId: diffTarget.userGroupId,
                sex: diffTarget.sex,
                emailAddress: diffTarget.email,
                phoneNumber: diffTarget.phone,
                isDisabled: diffTarget.isDisabled,
                grade: diffTarget.grade,
                tel: diffTarget.tel
              });
            diffTarget.id = newItem.id;
          }
          else {
            //update
            console.log("update");
            for (const diffTarget of diffTargets) {
              await db.employee.where(item => [
                sorm.equal(item.id, diffTarget.id)
              ])
                .updateAsync(
                  () => ({
                    name: diffTarget.name!,
                    department: diffTarget.department,
                    position: diffTarget.position,
                    groupId: diffTarget.userGroupId,
                    sex: diffTarget.sex,
                    emailAddress: diffTarget.email,
                    phoneNumber: diffTarget.phone,
                    isDisabled: diffTarget.isDisabled,
                    grade: diffTarget.grade,
                    tel: diffTarget.tel
                  })
                );
            }

          }
        }
      });

      this.orgItems = Object.clone(this.items);
      this._toast.success("저장되었습니다.");
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);

        this.items = await queryable
          .include(item => item.userGroup)
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .select(item => ({
            id: item.id,
            name: item.name,
            userId: item.userId,
            password: item.encryptedPassword,
            department: item.department,
            position: item.position,
            userGroupId: item.groupId,
            sex: item.sex,
            userGroupName: item.userGroup!.name,
            phone: item.phoneNumber,
            email: item.emailAddress,
            isDisabled: item.isDisabled,
            grade: item.grade,
            tel: item.tel
          }))
          .resultAsync();
        this.orgItems = Object.clone(this.items);

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 50);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<Employee> {
    let queryable = db.employee
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.id) {
      queryable = queryable.where(item => [
        sorm.includes(item.userId, this.lastFilter!.id)
      ]);
    }

    if (this.lastFilter!.name) {
      queryable = queryable.where(item => [
        sorm.includes(item.name, this.lastFilter!.name)
      ]);
    }

    if (this.lastFilter!.department) {
      queryable = queryable.where(item => [
        sorm.includes(item.department, this.lastFilter!.department)
      ]);
    }

    queryable = queryable.where(item => [
      sorm.equal(item.isDisabled, this.lastFilter!.isDisabled)
    ]);

    return queryable;
  }
}

interface IFilterVM {
  id?: string;
  name?: string;
  isDisabled: boolean;
  department?: string;
}

interface IEmployeeVM {
  id: number | undefined;
  name: string | undefined;
  userId: string | undefined;
  password: string | undefined;
  department: string | undefined;
  position: string | undefined;
  userGroupId: number | undefined;
  userGroupName: string | undefined;
  sex: number | undefined;
  email: string | undefined;
  phone: string | undefined;
  isDisabled: boolean;
  grade: string | undefined;
  tel: string | undefined;
}
