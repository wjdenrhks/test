import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext, Scrap} from "@sample/main-database";
import {DateOnly} from "@simplism/core";

@Component({
  selector: "app-show-scrap-info-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <sd-dock-container style="min-width: 500px;">
      <sd-dock class="sd-padding-sm-default">
        <sd-pagination [page]="pagination.page" [length]="pagination.length"
                       (pageChange)="onPageClick($event)"></sd-pagination>
      </sd-dock>
      <sd-busy-container [busy]="busyCount > 0">
        <sd-sheet [id]="'show-scrap-info-modal'" [items]="items" [trackBy]="trackByIdFn">
          <sd-sheet-column [header]="'생산일'">
            <ng-template #item let-item="item">
              <div class="sd-padding-xs-sm" style="text-align: center;">
                {{ item.dueDate?.toFormatString("yyyy-MM-dd") }}
              </div>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'설비'">
            <ng-template #item let-item="item">
              <div class="sd-padding-xs-sm" style="text-align: center;">
                {{ item.equipmentName }}
              </div>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'스크랩 유형'">
            <ng-template #item let-item="item">
              <div class="sd-padding-xs-sm" style="text-align: center;">
                {{ item.typeName }}
              </div>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column [header]="'수량'">
            <ng-template #item let-item="item">
              <div class="sd-padding-xs-sm" style="text-align: center;">
                {{ item.quantity | number }}
              </div>
            </ng-template>
          </sd-sheet-column>
        </sd-sheet>
      </sd-busy-container>
    </sd-dock-container>
  `
})
export class ShowScrapInfoModal extends SdModalBase<{ equipmentId: number; typeId: number; searchFromDate: DateOnly; searchToDate: DateOnly }, any> {
  public filter: {
    equipmentId?: number;
    typeId?: number;
    searchFromDate?: DateOnly;
    searchToDate?: DateOnly;
  } = {};

  public lastFilter?: {
    equipmentId?: number;
    typeId?: number;
    searchFromDate?: DateOnly;
    searchToDate?: DateOnly;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: ISearchScaripInfoModalVM[] = [];
  public orgItems: ISearchScaripInfoModalVM[] = [];

  public busyCount = 0;

  public trackByIdFn(item: any): number {
    return item.id;
  }

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider) {
    super();
  }

  public async sdOnOpen(param: { equipmentId: number; typeId: any; searchFromDate: DateOnly; searchToDate: DateOnly }): Promise<void> {
    this.busyCount++;

    this.filter.equipmentId = param.equipmentId;
    this.filter.typeId = param.typeId;
    this.filter.searchFromDate = param.searchFromDate;
    this.filter.searchToDate = param.searchToDate;
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

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        this.items = await queryable
          .include(item => item.production!.equipment)
          .include(item => item.type)
          .orderBy(item => item.id)
          .limit(this.pagination.page * 20, 20)
          .select(item => ({
            id: item.id,
            dueDate: item.occurrenceDate,
            equipmentId: item.production!.equipmentId,
            equipmentName: item.production!.equipment!.name,
            typeId: item.typeId,
            typeName: item.type!.name,
            quantity: item.weight
          }))
          .resultAsync();

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

  private _getSearchQueryable(db: MainDbContext): Queryable<Scrap> {
    return db.scrap
      .include(item => item.production)
      .where(item => [
        sorm.between(item.occurrenceDate, this.lastFilter!.searchFromDate!.addMonths(-12), this.lastFilter!.searchToDate!),
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.typeId, this.lastFilter!.typeId),
        sorm.equal(item.production!.equipmentId, this.lastFilter!.equipmentId)
      ]);
  }
}

interface ISearchScaripInfoModalVM {
  id: number | undefined;
  dueDate: DateOnly | undefined;
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  typeId: number | undefined;
  typeName: string | undefined;
  quantity: number | undefined;
}
