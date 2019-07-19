import {SdDomValidatorProvider, SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext} from "@sample/main-database";
import {ResponsibleManager} from "../../../main-database/src";
import {DateOnly} from "@simplism/core";

@Component({
  selector: "app-manager-register-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 680px;">
        <sd-dock class="sd-padding-sm-default">
          <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
            <sd-form-item [label]="'년'">
              <sd-select [(value)]="filter.year">
                <sd-select-item [value]="undefined">전체</sd-select-item>
                <sd-select-item *ngFor="let year of yearList; trackBy: trackByMeFn"
                                [value]="year">
                  {{ year }}
                </sd-select-item>
              </sd-select>
            </sd-form-item>
            <sd-form-item [label]="'월'">
              <sd-select [(value)]="filter.month">
                <sd-select-item [value]="undefined">전체</sd-select-item>
                <sd-select-item *ngFor="let month of monthList; trackBy: trackByMeFn"
                                [value]="month">
                  {{ month }}
                </sd-select-item>
              </sd-select>
            </sd-form-item>
            <sd-form-item [label]="'주'">
              <sd-select [(value)]="filter.week">
                <sd-select-item [value]="undefined">전체</sd-select-item>
                <sd-select-item *ngFor="let week of weekList; trackBy: trackByMeFn"
                                [value]="week">
                  {{ week }}
                </sd-select-item>
              </sd-select>
            </sd-form-item>
            <sd-form-item [label]="'관리자명'">
              <sd-textfield [(value)]="filter.name"></sd-textfield>
            </sd-form-item>
            <sd-form-item>
              <sd-button [type]="'submit'">
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
        <sd-dock class="sd-padding-sm-default" [position]="'bottom'" style="padding-left: 20px;">
          <sd-form [inline]="true">
            <sd-form-item style="text-align: left">
              <sd-button [size]="'sm'" (click)="onAddButtonClick()">
                <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                행 추가
              </sd-button>
            </sd-form-item>
            <sd-form-item style="text-align: right; padding-left: 460px;">
              <sd-button [type]="'submit'" (click)="onSaveButtonClick()">
                <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
                저장
              </sd-button>
            </sd-form-item>
          </sd-form>
        </sd-dock>
        <sd-sheet [id]="'manager-register-modal'" [items]="items" [trackBy]="trackByIdFn">
          <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
            <ng-template #item let-item="item">
              <div class="sd-padding-xs-sm" style="text-align: center;">
                <span *ngIf="item.id">{{ item.id }}</span>
                <a *ngIf="!item.id" (click)="onRemoveItemButtonClick(item)">
                  <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                </a>
              </div>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'년/월'" [width]="90">
            <ng-template #item let-item="item">
              <div class="sd-padding-xs-sm" style="text-align: center;">
                <app-input-date [(year)]="item.year" [(month)]="item.month"></app-input-date>
              </div>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'주'" [width]="60">
            <ng-template #item let-item="item">
              <sd-select [(value)]="item.week">
                <sd-select-item *ngFor="let week of weekList; trackBy: trackByMeFn"
                                [value]="week">
                  {{ week }}
                </sd-select-item>
              </sd-select>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'주/야간'">
            <ng-template #item let-item="item">
              <sd-select [(value)]="item.type">
                <sd-select-item [value]="'주간'">주간</sd-select-item>
                <sd-select-item [value]="'야간'">야간</sd-select-item>
              </sd-select>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'담당자'">
            <ng-template #item let-item="item">
              <app-employee-select [(value)]="item.employeeId" [required]="true" [employeeList]="employeeList" [text]="item.employeeName"></app-employee-select>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'삭제'" [width]="40">
            <ng-template #item let-item="item">
              <div style="text-align: center;">
                <sd-checkbox [(value)]="item.isDeleted" [disabled]="!item.id"></sd-checkbox>
              </div>
            </ng-template>
          </sd-sheet-column>
        </sd-sheet>
      </sd-dock-container>
    </sd-busy-container>
  `
})
export class ManagerRegisterModal extends SdModalBase<undefined, any> {
  public filter: {
    year?: number;
    month?: number;
    week?: number;
    name?: string;
  } = {};

  public lastFilter?: {
    year?: number;
    month?: number;
    week?: number;
    name?: string;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: IManagerRegisterModalVM[] = [];
  public orgItems: IManagerRegisterModalVM[] = [];

  public busyCount = 0;

  public employeeList: {
    id: number;
    userId: string;
    name: string;
  }[] = [];

  public yearList = [] as number[];
  public monthList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  public weekList = [1, 2, 3, 4, 5];

  public trackByIdFn(item: any): number {
    return item.id;
  }

  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider) {
    super();
  }

  public async sdOnOpen(): Promise<void> {
    this.busyCount++;

    await this._orm.connectAsync(MainDbContext, async db => {
      this.employeeList = await db.employee
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.department, "생산부"),
          sorm.equal(item.isDisabled, false)
        ])
        .select(item => ({
          id: item.id!,
          name: item.name,
          userId: item.userId
        }))
        .resultAsync();
    });

    this.filter.year = new DateOnly().year;

    for (let i = 2018; i <= this.filter.year + 1; i++) {
      this.yearList.push(i);
    }

    this.busyCount--;
    await this.onSearchFormSubmit();
    this._cdr.markForCheck();
  }

  public onAddButtonClick(): void {

    this.items.insert(0, {
      id: undefined,
      year: new DateOnly().year,
      month: new DateOnly().month,
      week: 1,
      type: "주간",
      employeeId: undefined,
      employeeName: undefined,
      isDeleted: false
    });

    this._cdr.markForCheck();
  }

  public onRemoveItemButtonClick(item: IManagerRegisterModalVM): void {
    this.items.remove(item);
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.pagination.page = 0;
    this.lastFilter = Object.clone(this.filter);
    await this._search();
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
  }

  public async onSaveButtonClick(): Promise<void> {
    await this._save();
    this._cdr.markForCheck();
  }

  private async _save(): Promise<void> {
    const diffTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);

    if (diffTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    for (const diffItem of diffTargets) {
      if (!diffItem.year || !diffItem.month) {
        this._toast.danger("년/월 을 입력해 주세요.");
        return;
      }

      if (this.items.filter(item => (item.year === diffItem.year && item.month === diffItem.month
        && item.week === diffItem.week && item.type === diffItem.type && item.employeeId === diffItem.employeeId)).length > 1) {
        this._toast.danger("동일한 담당자가 추가되어 있습니다.");
        return;
      }

    }

    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      Object.validatesArray(
        diffTargets,
        `담당 관리자`,
        {
          id: {displayName: "ID", type: Number},
          employeeId: {displayName: "담당자", notnull: true},
          isDeleted: {displayName: "삭제", type: Boolean, notnull: true}
        }
      );

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diffItem of diffTargets) {
          // INSERT
          if (!diffItem.id) {

            if (
              !diffItem.isDeleted &&
              await db.responsibleManager
                .where(item => [
                  sorm.equal(item.type, diffItem.type!),
                  sorm.equal(item.year, diffItem.year!),
                  sorm.equal(item.month, diffItem.month!),
                  sorm.equal(item.week, diffItem.week!),
                  sorm.equal(item.managerId, diffItem.employeeId!)
                ])
                .countAsync() > 0
            ) {
              throw new Error("\"동일한 일자에 담당자가 등록되어 있습니다");
            }

            const newProductionInstruction = await db.responsibleManager
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                year: diffItem.year!,
                month: diffItem.month!,
                week: diffItem.week!,
                type: diffItem.type,
                managerId: diffItem.employeeId!
              });
            diffItem.id = newProductionInstruction.id;
          }
          // UPDATE
          else {
            if (diffItem.isDeleted) {
              await db.responsibleManager.where(item => [sorm.equal(item.id, diffItem.id)]).deleteAsync();
            }
            else {
              await db.responsibleManager
                .where(item => [
                  sorm.equal(item.id, diffItem.id)
                ])
                .updateAsync(
                  () => ({
                    year: diffItem.year!,
                    month: diffItem.month!,
                    week: diffItem.week!,
                    type: diffItem.type,
                    managerId: diffItem.employeeId!
                  })
                );
            }
          }
        }
      });

      this.orgItems = Object.clone(this.items);

      this._toast.success("저장되었습니다.");
      this.close(true);
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        this.items = await queryable
          .include(item => item.employee)
          .orderBy(item => item.id)
          .limit(this.pagination.page * 20, 20)
          .select(item => ({
            id: item.id,
            year: item.year,
            month: item.month,
            week: item.week,
            type: item.type,
            employeeId: item.managerId,
            employeeName: item.employee!.name,
            isDeleted: sorm.cast(false, Boolean)
          }))
          .resultAsync();

        this.orgItems = Object.clone(this.items);

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 20);

      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
    finally {
      this.busyCount--;
      this._cdr.markForCheck();

    }
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<ResponsibleManager> {
    let queryable = db.responsibleManager
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.year) {
      queryable = queryable.where(item => [
        sorm.equal(item.year, this.lastFilter!.year)
      ]);
    }

    if (this.lastFilter!.month) {
      queryable = queryable.where(item => [
        sorm.equal(item.month, this.lastFilter!.month)
      ]);
    }

    if (this.lastFilter!.week) {
      queryable = queryable.where(item => [
        sorm.equal(item.week, this.lastFilter!.week)
      ]);
    }

    if (this.lastFilter!.name) {
      queryable = queryable
        .include(item => item.employee)
        .where(item => [
          sorm.includes(item.employee!.name, this.lastFilter!.name)
        ]);
    }

    return queryable;
  }
}

interface IManagerRegisterModalVM {
  id: number | undefined;
  year: number | undefined;
  month: number | undefined;
  week: number | undefined;
  type: "주간" | "야간" | undefined;
  employeeId: number | undefined;
  employeeName: string | undefined;
  isDeleted: boolean | undefined;
}
