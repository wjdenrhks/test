import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext} from "@sample/main-database";
import {Partner} from "../../../main-database/src";

@Component({
  selector: "app-partner-search-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 720px;">
        <sd-dock class="sd-padding-sm-default">
          <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
            <sd-form-item [label]="'거래처명'">
              <sd-textfield [(value)]="filter.partnerName"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'거래처 구분'">
              <sd-select [(value)]="filter.type">
                <sd-select-item [value]="undefined">전체</sd-select-item>
                <sd-select-item [value]="'매출처'">매출 거래처</sd-select-item>
                <sd-select-item [value]="'매입처'">매입 거래처</sd-select-item>
                <sd-select-item [value]="'본사'">본사</sd-select-item>
              </sd-select>
            </sd-form-item>
            <sd-form-item [label]="'수출업체 여부'">
              <sd-select [(value)]="filter.isExport">
                <sd-select-item [value]="undefined">전체</sd-select-item>
                <sd-select-item [value]="false">일반 거래처</sd-select-item>
                <sd-select-item [value]="true">수출 거래처</sd-select-item>
              </sd-select>
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

        <ng-container *ngIf="isMulti !== false">
          <sd-sheet [id]="'partner-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="'multi'"
                    (selectedItemsChange)="onSelectedItemsChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'거래처'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.name }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'대표자명'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.representative }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'구분'" [width]="100">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.type }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'수출업체'" [width]="70">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.isExport === true ? "수출" : "일반" }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'사용중지'" [width]="70">
              <ng-template #item let-item="item">
                <div style="text-align: center;">
                  <sd-checkbox [(value)]="item.isDisabled" [disabled]="true"></sd-checkbox>
                </div>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>
          <sd-dock [position]="'bottom'"
                   style="text-align: right; padding-right: 20px; padding-top: 5px; margin-top: 5px; margin-bottom: 5px;">
            <sd-form [inline]="true" (submit)="onSelectedItem()">
              <sd-form-item>
                <sd-button [type]="'submit'">
                  <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
                  저장
                </sd-button>
              </sd-form-item>
            </sd-form>
          </sd-dock>
        </ng-container>
        <ng-container *ngIf="isMulti === false">
          <sd-sheet [id]="'partner-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="true"
                    (selectedItemChange)="onSelectedItemChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'거래처'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.name }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'대표자명'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.representative }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'구분'" [width]="100">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.type }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'수출업체'" [width]="70">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.isExport === true ? "O" : "X" }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'사용중지'" [width]="70">
              <ng-template #item let-item="item">
                <div style="text-align: center;">
                  <sd-checkbox [(value)]="item.isDisabled" [disabled]="true"></sd-checkbox>
                </div>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>
        </ng-container>

      </sd-dock-container>
    </sd-busy-container>`
})
export class PartnerSearchModal extends SdModalBase<{ partnerId?: number; isMulti?: boolean }, any> {
  public filter: {
    partnerId?: number;
    type?: "매입처" | "매출처" | "본사" | undefined;
    isExport?: boolean;
    partnerName?: string;
  } = {};

  public lastFilter?: {
    partnerId?: number;
    type?: "매입처" | "매출처" | "본사" | undefined;
    isExport?: boolean;
    partnerName?: string;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: IPartnerModalVM[] = [];
  public orgItems: IPartnerModalVM[] = [];

  public busyCount = 0;
  public isDisabled?: boolean;
  public isMulti: boolean | undefined;

  public trackByIdFn(item: any): number {
    return item.id;
  }

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider) {
    super();
  }

  public async sdOnOpen(param: { partnerId?: number; isMulti?: boolean }): Promise<void> {
    this.busyCount++;

    this.isMulti = param.isMulti;

    this.filter.partnerId = param.partnerId;

    await this.onSearchFormSubmit();

    this.busyCount--;
    this._cdr.markForCheck();
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

  public onSelectedItemsChange(item: any): void {
    this.items = Object.clone(item);
  }

  public onSelectedItem(): void {
    this.close(this.items);
  }

  public onSelectedItemChange(item: IPartnerModalVM): void {
    this.close(item);
  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        const result = await queryable
          .orderBy(item => item.id)
          .limit(this.pagination.page * 20, 20)
          .select(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            isExport: item.isExport,
            erpSync: item.erpSyncCode,
            representative: item.representative,
            isDisabled: item.isDisabled,
            erpSyncCode: item.erpSyncCode
          }))
          .resultAsync();

        this.orgItems = result.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          isExport: item.isExport,
          erpSync: item.erpSync,
          representative: item.representative,
          isDisabled: item.isDisabled,
          erpSyncCode: item.erpSyncCode
        }));

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

  private _getSearchQueryable(db: MainDbContext): Queryable<Partner> {
    let queryable = db.partner
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.isDisabled, false)
      ]);

    if (this.lastFilter!.partnerId) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.id, this.lastFilter!.partnerId)
        ]);
    }

    if (this.lastFilter!.type !== undefined) {
      queryable = queryable.where(item => [
        sorm.equal(item.type, this.lastFilter!.type)
      ]);
    }

    if (this.lastFilter!.isExport !== undefined) {
      queryable = queryable.where(item => [
        sorm.equal(item.isExport, this.lastFilter!.isExport)
      ]);
    }

    if (this.lastFilter!.partnerName) {
      queryable = queryable
        .where(item => [
          sorm.includes(item.name, this.lastFilter!.partnerName)
        ]);
    }


    return queryable;
  }
}

interface IPartnerModalVM {
  id: number | undefined;
  name: string | undefined;
  type: "매입처" | "매출처" | "본사" | undefined;
  isExport: boolean | undefined;
  erpSync: number | undefined;
  representative: string | undefined;
  isDisabled: boolean;
  erpSyncCode: number | undefined;
}

