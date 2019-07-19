import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit} from "@angular/core";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {SdDomValidatorProvider, SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {JsonConvert} from "@simplism/core";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-employee-permission",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
        <h4>사용자그룹 관리</h4>

          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onRefreshButtonClick()">
            <sd-icon [icon]="'sync-alt'" [fixedWidth]="true"></sd-icon>
            새로고침
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
            메뉴얼 보기
          </sd-topbar-menu>
        </sd-topbar>

        <sd-dock-container>
          <sd-dock [position]="'left'" style="width: 320px;" class="sd-border-right-default">
            <sd-dock-container class="sd-background-default">
              <sd-dock class="sd-padding-sm-default">
                <sd-form [inline]="true">
                  <sd-form-item>
                    <sd-textfield [placeholder]="'검색(명칭)'" [(value)]="groupFilter.name"></sd-textfield>
                  </sd-form-item>
                  <sd-form-item>
                    <sd-button (click)="onAddItemButtonClick()" [theme]="'primary'">
                      <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                      행 추가
                    </sd-button>
                  </sd-form-item>
                </sd-form>
              </sd-dock>

              <sd-sheet [id]="'user-group'" [items]="getGroupFilteredItems()"
                        [trackBy]="trackByIdFn"
                        [(selectedItem)]="selectedItem"
                        [selectable]="true">
                <sd-sheet-column [width]="30">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <a tabindex="0" (click)="onRemoveItemButtonClick(item)">
                        <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'ID'" [width]="40">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span>{{ item.id }}</span>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'명칭'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.name" [required]="true"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>
            </sd-dock-container>
          </sd-dock>

          <sd-dock class="sd-padding-sm-default" *ngIf="selectedItem">
            <sd-form [inline]="true">
              <sd-form-item>
                <sd-textfield [placeholder]="'대분류'" [(value)]="itemFilter.category1"></sd-textfield>
              </sd-form-item>
              <sd-form-item>
                <sd-textfield [placeholder]="'소분류'" [(value)]="itemFilter.category2"></sd-textfield>
              </sd-form-item>
              <sd-form-item>
                <sd-textfield [placeholder]="'세부내용'" [(value)]="itemFilter.task"></sd-textfield>
              </sd-form-item>
            </sd-form>
          </sd-dock>

          <sd-sheet [id]="'user-group-permission'"
                    *ngIf="selectedItem"
                    [items]="getItemFilteredItems()"
                    [trackBy]="trackByCodeFn">
            <sd-sheet-column [header]="'대분류'" [fixed]="true">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm">
                  {{ item.category1 }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'소분류'" [fixed]="true">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm">
                  {{ item.category2 }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'세부내용'" [fixed]="true">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm">
                  {{ item.task }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'권한 여부'">
              <ng-template #item let-item="item">
                <div style="text-align: center;"
                     *ngIf="item.type === 'boolean'">
                  <sd-checkbox [value]="getPermissionValue(item)"
                               (valueChange)="setPermissionValue(item, $event)"></sd-checkbox>
                </div>

                <div style="text-align: center;"
                     *ngIf="item.type === 'multi-select'">
                  <sd-multi-select [value]="getPermissionValue(item)"
                                   (valueChange)="setPermissionValue(item, $event)">
                    <sd-multi-select-item *ngFor="let item of item.items; trackBy: trackByMeFn"
                                          [value]="item">
                      {{ item }}
                    </sd-multi-select-item>
                  </sd-multi-select>
                </div>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class EmployeePermissionPage implements OnInit {
  public viewBusyCount = 0;

  public items: IUserGroupVM[] = [];
  public orgItems: IUserGroupVM[] = [];

  public selectedItem?: IUserGroupVM;
  public permissions: IPermissionVM[] = [];

  public groupFilter: {
    name?: string;
  } = {};

  public itemFilter: {
    category1?: string;
    category2?: string;
    task?: string;
  } = {};

  public getGroupFilteredItems(): IUserGroupVM[] {
    return this.items.filter(item => !item.name || item.name.includes(this.groupFilter.name || ""));
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "사용자그룹 관리 메뉴얼", {type: "permission"});
    if (!result) return;

    this._cdr.markForCheck();
  }


  public getItemFilteredItems(): IPermissionVM[] {
    return this.permissions.filter(item => (
      !item.category1 || item.category1.includes(this.itemFilter.category1 || ""))
      && (!item.category2 || item.category2.includes(this.itemFilter.category2 || ""))
      && (!item.task || item.task.includes(this.itemFilter.task || "")));
  }

  public trackByMeFn = (i: number, item: any) => item;
  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByCodeFn = (index: number, item: any) => item.code || item;

  public getPermissionValue(permission: IPermissionVM): any {
    this.selectedItem!.permissions = this.selectedItem!.permissions || [];

    if (permission.type === "boolean") {
      const selectedItemPermission = this.selectedItem!.permissions!.single(item => item.code === permission.code);
      if (!selectedItemPermission) {
        return false;
      }
      return JsonConvert.parse(selectedItemPermission.valueJson) || false;
    }
    else if (permission.type === "multi-select") {
      const selectedItemPermission = this.selectedItem!.permissions!.single(item => item.code === permission.code);
      if (!selectedItemPermission) {
        return [];
      }
      return JsonConvert.parse(selectedItemPermission.valueJson) || [];
    }
    else {
      throw new Error("미구현");
    }
  }

  public setPermissionValue(permission: IPermissionVM, value: any): void {
    this.selectedItem!.permissions = this.selectedItem!.permissions || [];

    const selectedItemPermission = this.selectedItem!.permissions!.single(item => item.code === permission.code);
    if (!selectedItemPermission) {
      if (value !== undefined) {
        this.selectedItem!.permissions!.push({
          code: permission.code,
          valueJson: JsonConvert.stringify(value)!
        });
      }
    }
    else {
      if (value !== undefined) {
        selectedItemPermission.valueJson = JsonConvert.stringify(value)!;
      }
      else {
        this.selectedItem!.permissions!.remove(selectedItemPermission);
      }
    }
  }

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _appData: AppDataProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    this.permissions = [
      this._getPermissionVM("base-info.base-type", "기준정보 관리", "기초정보 관리"),
      this._getPermissionVM("base-info.partner", "기준정보 관리", "거래처 관리"),
      this._getPermissionVM("base-info.goods", "기준정보 관리", "제품 관리"),
      this._getPermissionVM("base-info.goods-group", "기준정보 관리", "제품 그룹 정보(생산)"),
      this._getPermissionVM("base-info.goods-build-group", "기준정보 관리", "제품 그룹 정보(BOM)"),
      this._getPermissionVM("base-info.production-info", "기준정보 관리", "생산 관리"),
      this._getPermissionVM("base-info.goods-build", "기준정보 관리", "BOM 관리"),
      this._getPermissionVM("base-info.equipment", "기준정보 관리", "설비 관리"),
      this._getPermissionVM("base-info.warehouse", "기준정보 관리", "창고 관리"),
      this._getPermissionVM("base-info.employee", "기준정보 관리", "사용자 관리"),
      this._getPermissionVM("base-info.employee-permission", "기준정보 관리", "사용자 권한 관리"),
      this._getPermissionVM("production.production-plan", "생산 관리", "생산계획 관리"),
      this._getPermissionVM("production.production-instruction", "생산 관리", "생산지시 관리"),
      this._getPermissionVM("goods-transaction.goods-receipt", "재고 관리", "재고입고 관리"),
      this._getPermissionVM("goods-transaction.stock-transfer", "재고 관리", "재고이동 관리"),
      this._getPermissionVM("goods-transaction.stock-adjustment", "재고 관리", "재고조정 관리"),
      this._getPermissionVM("goods-transaction.stock-current", "재고 관리", "재고현황 관리"),
      this._getPermissionVM("goods-transaction.lot-trans", "재고 관리", "LOT전환 관리"),
      this._getPermissionVM("goods-transaction.packing", "재고 관리", "포장 관리"),
      this._getPermissionVM("process.combination-process", "공정 관리", "배합처리"),
      this._getPermissionVM("process.process-push", "공정 관리", "밀어내기"),
      this._getPermissionVM("process.rewinder-process", "공정 관리", "리와인더 작업"),
      this._getPermissionVM("process.process-production", "공정 관리", "생산실적 등록"),
      this._getPermissionVM("process.lot-history", "공정 관리", "Lot 이력조회"),
      this._getPermissionVM("inspection.receipt-inspection", "품질 관리", "수입검사"),
      this._getPermissionVM("inspection.qc-inspection", "품질 관리", "QC 검사등록"),
      this._getPermissionVM("inspection.first-middle-last-inspection", "품질 관리", "Xbar-R 차트"),
      this._getPermissionVM("shipment.shipping-plan", "출하 관리", "출하계획"),
      this._getPermissionVM("shipment.shipping-register", "출하 관리", "출하 등록"),
      this._getPermissionVM("shipment.shipping-history", "출하 관리", "출하 이력 조회")
    ].filterExists();

    await this._refresh();
    this._cdr.markForCheck();
  }

  private _getPermissionVM(code: string, category1: string, category2: string, task: string = "사용", type: "boolean" | "multi-select" = "boolean", items?: string[]): IPermissionVM | undefined {
    return this._appData.authInfo!.companyConfig[code]
      ? {code, category1, category2, task, type, items}
      : undefined;
  }

  public async onRefreshButtonClick(): Promise<void> {
    await this._refresh();
    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      name: undefined
    });
    this.selectedItem = this.items[0];
  }

  public onRemoveItemButtonClick(item: IUserGroupVM): void {
    this.items.remove(item);
    this.selectedItem = undefined;
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

  private async _refresh(): Promise<void> {
    this.selectedItem = undefined;

    this.viewBusyCount++;
    await this._orm.connectAsync(MainDbContext, async db => {
      this.items = await db.userGroup
        .include(item => item.permissions)
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId)
        ])
        .select(item => ({
          id: item.id,
          name: item.name,

          permissions: item.permissions!.map(item1 => ({
            code: item1.code,
            valueJson: item1.valueJson
          }))
        }))
        .resultAsync();

      this.orgItems = Object.clone(this.items);
    });
    this.viewBusyCount--;
  }

  private async _save(): Promise<void> {
    const diffs = this.orgItems.diffs(this.items, {keyProps: ["id"]});
    if (diffs.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    this.viewBusyCount++;
    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diff of diffs) {
          // INSERT
          if (!diff.source && diff.target) {
            const inserted = await db.userGroup.insertAsync({
              companyId: this._appData.authInfo!.companyId,
              name: diff.target!.name!
            });
            diff.target.id = inserted.id;

            for (const diffPermission of diff.target.permissions || []) {
              await db.userGroupPermission.insertAsync({
                companyId: this._appData.authInfo!.companyId,
                userGroupId: inserted.id!,
                code: diffPermission.code,
                valueJson: diffPermission.valueJson
              });
            }
          }
          // UPDATE
          else if (diff.source && diff.target) {
            await db.userGroup
              .where(item => [
                sorm.equal(item.id, diff.target!.id)
              ])
              .updateAsync(() => ({
                name: diff.target!.name!
              }));

            await db.userGroupPermission
              .where(item => [
                sorm.equal(item.userGroupId, diff.target!.id)
              ])
              .deleteAsync();

            for (const diffPermission of diff.target.permissions || []) {
              await db.userGroupPermission.insertAsync({
                companyId: this._appData.authInfo!.companyId,
                userGroupId: diff.target!.id!,
                code: diffPermission.code,
                valueJson: diffPermission.valueJson
              });
            }
          }
          // DELETE
          else {
            await db.userGroupPermission
              .where(item => [
                sorm.equal(item.userGroupId, diff.source!.id)
              ])
              .deleteAsync();

            await db.userGroup
              .where(item => [
                sorm.equal(item.id, diff.source!.id)
              ])
              .deleteAsync();
          }
        }
      });

      this.orgItems = Object.clone(this.items);
      this._toast.success("저장되었습니다.");
    }
    catch (err) {
      if (err.message.includes("DELETE") && err.message.includes("DELETE", "User", "groupId")) {
        this._toast.danger("이미 특정 사용자가 이 사용자그룹을 사용하고 있습니다.");
        if (process.env.NODE_ENV !== "production") console.error(err);
      }
      else {
        this._toast.danger(err.message);
        if (process.env.NODE_ENV !== "production") console.error(err);
      }
    }

    this.viewBusyCount--;
  }
}

interface IUserGroupVM {
  id: number | undefined;
  name: string | undefined;

  permissions?: IUserGroupPermissionVM[];
}

interface IUserGroupPermissionVM {
  code: string;
  valueJson: string;
}

interface IPermissionVM {
  code: string;
  category1: string;
  category2: string;
  task: string;
  type: string;
  items: string[] | undefined;
}
