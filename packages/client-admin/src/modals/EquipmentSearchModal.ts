import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext} from "@sample/main-database";
import {Equipment} from "../../../main-database/src";

@Component({
  selector: "app-equipment-search-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 720px;">
        <sd-dock class="sd-padding-sm-default">
          <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
            <sd-form-item [label]="'설비명'">
              <sd-textfield [(value)]="filter.name"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'설비기호'">
              <sd-textfield [(value)]="filter.code"></sd-textfield>
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
          <sd-sheet [id]="'equipment-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="'multi'"
                    (selectedItemsChange)="onSelectedItemsChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'설비명'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm">
                  {{ item.name }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'설비기호'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm">
                  {{ item.code }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'순서'" [width]="60">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  {{ item.seq }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'집계'" [width]="60">
              <ng-template #item let-item="item">
                <div style="text-align: center;">
                  <sd-checkbox [(value)]="item.isCount" [disabled]="true"></sd-checkbox>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'사용중지'" [width]="60">
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
          <sd-sheet [id]="'equipment-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="true"
                    (selectedItemChange)="onSelectedItemChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'설비명'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm">
                  {{ item.name }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'설비기호'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm">
                  {{ item.code }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'순서'" [width]="60">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  {{ item.seq }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'집계'" [width]="60">
              <ng-template #item let-item="item">
                <div style="text-align: center;">
                  <sd-checkbox [(value)]="item.isCount" [disabled]="true"></sd-checkbox>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'사용중지'" [width]="60">
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
export class EquipmentSearchModal extends SdModalBase<{ equipmentId?: number; isMulti?: boolean; isAll?: boolean }, any> {
  public filter: {
    equipmentId?: number;
    name?: string;
    code?: string;
    isAll?: boolean;
  } = {};

  public lastFilter?: {
    equipmentId?: number;
    name?: string;
    code?: string;
    isAll?: boolean;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: IEquipmentVM[] = [];
  public orgItems: IEquipmentVM[] = [];

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

  public async sdOnOpen(param: { equipmentId?: number; isMulti?: boolean; isAll?: boolean }): Promise<void> {
    this.busyCount++;

    this.isMulti = param.isMulti;

    this.filter.equipmentId = param.equipmentId;
    this.filter.isAll = param.isAll;

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

  public onSelectedItemChange(item: IEquipmentVM): void {
    this.close(item);
  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        const result = await queryable
          .orderBy(item => item.seq)
          .limit(this.pagination.page * 20, 20)
          .select(item => ({
            id: item.id,
            name: item.name,
            code: item.code,
            isCount: item.isCount,
            seq: item.seq,
            isDisabled: item.isDisabled
          }))
          .resultAsync();

        this.orgItems = result.map(item => ({
          id: item.id,
          name: item.name,
          code: item.code,
          isCount: item.isCount,
          seq: item.seq,
          isDisabled: item.isDisabled
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

  private _getSearchQueryable(db: MainDbContext): Queryable<Equipment> {
    let queryable = db.equipment
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (!this.lastFilter!.isAll) {
      queryable = queryable.where(item => [
        sorm.equal(item.isDisabled, false)
      ]);
    }

    if (this.lastFilter!.equipmentId) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.id, this.lastFilter!.equipmentId)
        ]);
    }

    if (this.lastFilter!.name) {
      queryable = queryable.where(item => [
        sorm.includes(item.name, this.lastFilter!.name!)
      ]);
    }

    if (this.lastFilter!.code) {
      queryable = queryable.where(item => [
        sorm.includes(item.code, this.lastFilter!.code!)
      ]);
    }

    return queryable;
  }
}

interface IEquipmentVM {
  id: number | undefined;
  name: string | undefined;
  code: string | undefined;
  isCount: boolean | undefined;
  seq: number | undefined;
  isDisabled: boolean | undefined;
}
