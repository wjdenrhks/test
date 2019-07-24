import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {AppDataProvider} from "@sample/client-common";
import {RouteConfigLoadEnd, RouteConfigLoadStart, Router} from "@angular/router";
import {Employee, IAuthInfo, MainDbContext, MySqlProc} from "@sample/main-database";
import {DateTime, JsonConvert} from "@simplism/core";
import {SdOrmProvider, SdSocketProvider, SdToastProvider} from "@simplism/angular";
import {sorm} from "@simplism/orm-query";
import {Queryable} from "@simplism/orm-client";

@Component({
  selector: "app-home",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-sidebar-container *ngIf="authInfo">
      <sd-sidebar>
        <sd-dock-container>
          <sd-dock class="sd-background-secondary-darkest">
            <div style="padding: 10px;">
              <a (click)="onProductionPlanNumberClick()" style="color: white;">
                <h2>삼성그라테크 MES</h2>
              </a>
            </div>

            <div class="sd-padding-default">
              <!--  <sd-dropdown style="float: right" [disabled]="alarms.length < 1">
                  <a>
                    <sd-icon [icon]="'bell'" [fixedWidth]="true" [dot]="alarms.length > 0"></sd-icon>
                  </a>
  
                  <sd-dropdown-popup>
                    <sd-list>
                      <sd-list-item *ngFor="let alarm of alarms; trackBy: trackByIdFn"
                                    (click)="onAlarmClick(alarm, $event)">
                        <div style="display: inline-block"
                             [class.sd-text-color-warning-default]="alarm.status === '진행'"
                             [class.sd-text-color-success-default]="alarm.status === '완료'"
                             [class.sd-text-color-danger-default]="alarm.status === '취소'"
                             [class.sd-text-color-grey-default]="!alarm.status">
                          {{ alarm.category }} #{{ alarm.itemId }}
                        </div>
  
                        <div style="display: inline-block" *ngIf="alarm.task === '등록'">
                          이/가 새로 등록되었습니다. 
                        </div>
                        <div style="display: inline-block" *ngIf="alarm.task === '수정'">
                          이/가 수정되었습니다.
                        </div>
                        <div class="sd-text-color-grey-default" style="text-align: right;">
                          <small>
                            {{ alarm.createdAtDateTime.toFormatString("yyyy년 M월 d일 tt h:m") }},
                            {{ alarm.createdByEmployeeName }}
                          </small>
                        </div>
                      </sd-list-item>
                    </sd-list>
                  </sd-dropdown-popup>
                </sd-dropdown>-->

              <sd-icon [icon]="'user-circle'" [fixedWidth]="true"></sd-icon>
              {{ authInfo.employeeName }}
              <a (click)="onLogoutButtonClick()">
                <sd-icon [icon]="'power-off'" [fixedWidth]="true"></sd-icon>
              </a>
              <div style="display: inline-block; float: right;">
                <a (click)="onSyncButtonClick()">
                  <sd-icon [icon]="'sync-alt'" [fixedWidth]="true"></sd-icon>
                </a>
                동기화
              </div>
            </div>
          </sd-dock>

          <sd-pane class="sd-border-right-primary-default sd-background-secondary-darkest">
            <br/>
            <sd-list>
              <ng-container *ngFor="let menu of menus; trackBy: trackByTitleFn">
                <sd-list-item *ngIf="menu.children.length > 0">
                  <sd-icon [icon]="menu.icon" [fixedWidth]="true"></sd-icon>
                  {{ menu.title }}
                  <sd-list>
                    <sd-list-item *ngFor="let menuItem of menu.children; trackBy: trackByTitleFn"
                                  (click)="onMenuItemClick(menuItem.path, $event)">
                      <sd-icon [fixedWidth]="true"></sd-icon>
                      {{ menuItem.title }}
                    </sd-list-item>
                  </sd-list>
                </sd-list-item>
              </ng-container>
            </sd-list>
          </sd-pane>
        </sd-dock-container>
      </sd-sidebar>


      <sd-busy-container [busy]="busyCount > 0 || isMainBusy">
        <router-outlet></router-outlet>
      </sd-busy-container>
    </sd-sidebar-container>`
})
export class HomePage implements OnInit {
  public logo = require("../assets/logo.png"); //tslint:disable-line:no-require-imports

  public authInfo?: IAuthInfo;
  public menus: {
    icon: string;
    title: string;
    children: {
      title: string;
      path: string;
    }[];
  }[] = [];

  public permissions: {
    code: string;
    category: string;
  }[] = [];

  public alarms: IAlarmVM[] = [];

  public busyCount = 0;
  public isMainBusy = false;

  public trackByTitleFn = (i: number, item: any) => item.title;
  public trackByIdFn = (i: number, item: any) => item.id;

  public constructor(private readonly _appData: AppDataProvider,
                     private readonly _router: Router,
                     private readonly _orm: SdOrmProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _socket: SdSocketProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  // private _getMenuItem(title: string, category: string, page: string): { title: string; path: string } | undefined {
  //   return {
  //     title,
  //     path: `/home/${category}/${page}`
  //   };
  // }

  public async ngOnInit(): Promise<void> {
    this._router.events.subscribe(event => {
      if (event instanceof RouteConfigLoadStart) {
        this.isMainBusy = true;
      }
      else if (event instanceof RouteConfigLoadEnd) {
        this.isMainBusy = false;
      }
    });

    if (!this._appData.authInfo) {
      await this._router.navigate(["/login"]);
      return;
    }

    this.authInfo = this._appData.authInfo;
    this.menus = [
      {
        icon: "cog", title: "기준정보 관리", children: [
          /*this._getMenuItem("기초정보", "base-info", "base-type"),
          this._getMenuItem("거래처 정보", "base-info", "partner"),
          this._getMenuItem("제품 정보", "base-info", "goods"),
          this._getMenuItem("생산 정보", "base-info", "production-info"),
          /!*this._getMenuItem("BOM 정보", "base-info", "goods-build"),
          this._getMenuItem("제품 그룹 정보(생산)", "base-info", "goods-group"),
          this._getMenuItem("제품 그룹 정보(BOM)", "base-info", "goods-build-group"),*!/
          this._getMenuItem("설비 정보", "base-info", "equipment"),
          this._getMenuItem("창고 관리", "base-info", "warehouse"),
          this._getMenuItem("사용자 정보", "base-info", "employee"),
          this._getMenuItem("사용자 권한 정보", "base-info", "employee-permission")*/
        ].filterExists()
      },
      {
        icon: "retweet", title: "생산 관리", children: [
          /*this._getMenuItem("생산계획 정보", "production", "production-plan"),
          this._getMenuItem("생산지시 등록", "production", "production-instruction")*/
        ].filterExists()
      },
      {
        icon: "truck-loading", title: "재고 관리", children: [
          /*this._getMenuItem("재고입고", "goods-transaction", "goods-receipt"),
          this._getMenuItem("재고이동", "goods-transaction", "stock-transfer"),
          this._getMenuItem("재고조정", "goods-transaction", "stock-adjustment"),
          this._getMenuItem("제품별 재고현황", "goods-transaction", "stock-current"),
          this._getMenuItem("창고별 재고현황", "goods-transaction", "stock-warehouse-current"),
          this._getMenuItem("LOT 전환", "goods-transaction", "lot-trans"),
          this._getMenuItem("포장관리", "goods-transaction", "packing")*/
        ].filterExists()
      },
      {
        icon: "atom", title: "공정 관리", children: [
          /*this._getMenuItem("배합처리", "process", "combination-process"),
          this._getMenuItem("밀어내기", "process", "process-push"),
          this._getMenuItem("생산실적 등록", "process", "process-production"),
          this._getMenuItem("리와인더 작업", "process", "process-rewind"),
          this._getMenuItem("중량측정", "process", "weight-measurement"),
          this._getMenuItem("Lot 이력조회", "process", "lot-history")*/
        ].filterExists()
      },
      {
        icon: "bug", title: "품질 관리", children: [
          /*this._getMenuItem("수입검사", "inspection", "receipt-inspection"),
          this._getMenuItem("QC 검사등록", "inspection", "qc-inspection"),
          this._getMenuItem("Xbar-R 차트", "inspection", "first-middle-last-inspection")*/
        ].filterExists()
      },
      {
        icon: "laptop", title: "출하 관리", children: [
          /*this._getMenuItem("출하계획", "shipment", "shipping-plan"),
          this._getMenuItem("출하 등록", "shipment", "shipping-register"),
          this._getMenuItem("출하 이력 조회", "shipment", "shipping-history")*/
        ].filterExists()
      },
      // {
      //   icon: "laptop", title: "테스트", children: [
      //     this._getMenuItem("테스트메뉴", "sample", "sample")
      //   ].filterExists()
      // },
      // {
      //   icon: "laptop", title: "테스트2", children: [
      //     this._getMenuItem("테스트메뉴2", "sample2", "sample2")
      //   ].filterExists()
      // },
      // {
      //   icon: "laptop", title: "두관", children: [
      //     this._getMenuItem("두관", "dookwan", "dookwan"),
      //     this._getMenuItem("두관2", "dookwan", "doo-two"),
      //     this._getMenuItem("두관3", "dookwan", "doo-three")
      //   ].filterExists()
      // },
      {
        icon: "code", title: "보고서 관리", children: [
          /*this._getMenuItem("생산일보 현황", "document", "production-instruction-report"),
          this._getMenuItem("스크랩 발생현황", "document", "scrap-status"),
          this._getMenuItem("제품별 스크랩 현황", "document", "good-scrap-status"),
          this._getMenuItem("생산량 대비 LOSS 현황", "document", "production-loss-status"),
          this._getMenuItem("리와인더 현황", "document", "rewind-status"),
          this._getMenuItem("분기별 생산 현황", "document", "quarterly-production-status"),
          this._getMenuItem("호기별 원재료 투입 현황", "document", "equipment-input-material-status"),
          this._getMenuItem("그룹별 생산 현황", "document", "group-production-status"),
          this._getMenuItem("그룹별 Loss 현황", "document", "group-loss-status"),
          this._getMenuItem("호기별 생산일수 및 생산인원", "document", "equipment-production-personnel-status"),
          this._getMenuItem("발주 현황", "document", "purchase-status")/!*,
          this._getMenuItem("DB", "document", "database-definition")*!/*/
        ].filterExists()
      }
    ];

    this.permissions = [
      //기준정보 관리
      {code: "base-type", category: "기초정보"},
      {code: "partner", category: "거래처 정보"},
      {code: "goods", category: "제품 정보"},
      {code: "production-info", category: "생산 정보"},
      {code: "equipment", category: "설비 정보"},
      {code: "warehouse", category: "창고 관리"},
      {code: "employee", category: "사용자 정보"},
      {code: "employee-permission", category: "사용자 권한 정보"},
      //생산 관리
      {code: "production-plan", category: "사용자 권한 정보"},
      {code: "production-instruction", category: "생산계획 정보"},
      //재고 관리
      {code: "goods-receipt", category: "재고입고"},
      {code: "stock-transfer", category: "재고이동"},
      {code: "stock-adjustment", category: "재고조정"},
      {code: "stock-current", category: "제품별 재고현황"},
      {code: "stock-warehouse-current", category: "창고별 재고현황"},
      {code: "lot-trans", category: "LOT 전환"},
      {code: "packing", category: "포장관리"},
      //공정 관리
      {code: "combination-process", category: "배합처리"},
      {code: "process-push", category: "밀어내기"},
      {code: "process-production", category: "생산실적 등록"},
      {code: "process-rewind", category: "리와인더 작업"},
      {code: "weight-measurement", category: "중량측정"},
      {code: "lot-history", category: "Lot 이력조회"},
      //품질 관리
      {code: "receipt-inspection", category: "수입검사"},
      {code: "qc-inspection", category: "QC 검사등록"},
      {code: "first-middle-last-inspection", category: "Xbar-R 차트"},
      //출하 관리
      {code: "shipping-plan", category: "출하계획"},
      {code: "shipping-register", category: "출하 등록"},
      {code: "shipping-history", category: "출하 이력 조회"},
      //보고서 관리
      {code: "production-instruction-report", category: "생산일보 현황"},
      {code: "scrap-status", category: "스크랩 발생현황"},
      {code: "good-scrap-status", category: "제품별 스크랩 현황"},
      {code: "production-loss-status", category: "생산량 대비 LOSS 현황"},
      {code: "rewind-status", category: "리와인더 현황"},
      {code: "quarterly-production-status", category: "분기별 생산 현황"},
      {code: "equipment-input-material-status", category: "호기별 원재료 투입 현황"},
      {code: "group-production-status", category: "그룹별 생산 현황"},
      {code: "group-loss-status", category: "그룹별 Loss 현황"},
      {code: "equipment-production-personnel-status", category: "호기별 생산일수 및 생산인원"},
      {code: "purchase-status", category: "발주 현황"}
    ];

    this.busyCount++;
    try{
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);

        let groupId = await queryable
          .select(item => ({
            groupId: item.groupId
          }))
          .resultAsync();

        let pageData = await db.userGroupPermission
          .where(item => [
            sorm.equal(item.userGroupId, groupId[0].groupId)
          ])
          .where(item => [
            sorm.equal(item.valueJson, "true")
          ])
          .select(item => ({
            code: item.code,
            valueJson: item.valueJson
          }))
          .resultAsync();

        for (let i = 0; i < pageData.length; i++) {
          let path1 = pageData[i].code.substr(0, pageData[i].code.indexOf("."));
          let path2 = pageData[i].code.substr(pageData[i].code.indexOf(".") + 1, pageData[i].code.length);
          let path = pageData[i].code.replace(".", "/");

          for (const nowScrapItem of this.permissions! || []) {
            if (path2 === nowScrapItem.code) {

              if (path1 === "base-info") {
                this.menus[0].children.push({title: nowScrapItem.category, path: "home/" + path});
              } else if (path1 === "production") {
                this.menus[1].children.push({title: nowScrapItem.category, path: "home/" + path});
              } else if (path1 === "goods-transaction") {
                this.menus[2].children.push({title: nowScrapItem.category, path: "home/" + path});
              } else if (path1 === "process") {
                this.menus[3].children.push({title: nowScrapItem.category, path: "home/" + path});
              } else if (path1 === "inspection") {
                this.menus[4].children.push({title: nowScrapItem.category, path: "home/" + path});
              } else if (path1 === "shipment") {
                this.menus[5].children.push({title: nowScrapItem.category, path: "home/" + path});
              } else if (path1 === "document") {
                this.menus[6].children.push({title: nowScrapItem.category, path: "home/" + path});
              }

            }
          }

        }
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
    this.busyCount--;

    await this._refreshAlarms();
    this._cdr.markForCheck();
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<Employee> {
    let queryable = db.employee
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this._appData.authInfo!.employeeId) {
      queryable = queryable.where(item => [
        sorm.equal(item.id, this._appData.authInfo!.employeeId)
      ]);
    }
    return queryable;
  }

  public async onProductionPlanNumberClick(): Promise<void> {
    await this._router.navigate(["/home/main"]);
  }

  public async onAlarmClick(alarm: IAlarmVM, event: MouseEvent): Promise<void> {
    const pageCode = alarm.category === "이슈" ? ["project", "issue"] : undefined;
    if (!pageCode) return;

    if (
      this._appData.authInfo!.companyConfig![`${pageCode[0]}.${pageCode[1]}`]
    ) {
      if (event.ctrlKey) {
        window.open(location.pathname + `#/home/${pageCode[0]}/${pageCode[1]};id=${alarm.itemId}`, "_blank");
      }
      else {
        await this._router.navigate([`/home/${pageCode[0]}/${pageCode[1]}`, {id: JsonConvert.stringify(alarm.itemId)}]);
      }
    }
  }

  public async onMenuItemClick(path: string, event: MouseEvent): Promise<void> {
    if (event.ctrlKey) {
      window.open(location.pathname + "#" + path, "_blank");
    }
    else {
      await this._router.navigate([path]);
    }
  }

  public async onLogoutButtonClick(): Promise<void> {
    this._appData.authInfo = undefined;
    await this._router.navigate(["/login"]);
  }

  public async onSyncButtonClick(): Promise<void> {
    this.busyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        await MySqlProc.syncEmployees(db, this._socket);
        await MySqlProc.syncGoods(db, this._socket);
        await MySqlProc.syncEquipments(db, this._socket);
        await MySqlProc.syncPartner(db, this._socket);

        this._toast.success("동기화가 완료 되었습니다");
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.busyCount--;
    this._cdr.markForCheck();
  }

  private async _refreshAlarms(): Promise<void> {
    this.alarms = await this._orm.connectAsync(MainDbContext, async db => {
      return await db.alarm
        .include(item => item.createdByEmployee)
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.employeeId, this._appData.authInfo!.employeeId)
        ])
        .select(item => ({
          id: item.id!,
          category: item.category as any,
          task: item.task as any,
          itemId: item.relatedItemId!,
          createdByEmployeeName: item.createdByEmployee!.name,
          createdAtDateTime: item.createdAtDateTime
        }))
        .resultAsync();
    });
  }

  /*private async _syncPartner(): Promise<void> {
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        // const lastSyncDateTime = (await db.erpSync.where(item => [sorm.equal(item.code, "Partner")]).singleAsync())!.syncDate;
        let updateErpPartnerList: any[] = [];

        updateErpPartnerList = await db.executeAsync([
          `SELECT * FROM OPENQUERY (MySQL_TS, 'SELECT * FROM Partner')`
        ]);

        await db.erpSync
          .where(item =>
            [sorm.equal(item.code, "Partner")]
          )
          .updateAsync(item => ({
            syncDate: new DateTime()
          }));

        for (const updateItem of updateErpPartnerList[0]) {
          await db.partner
            .where(item => [
              sorm.equal(item.erpSyncCode, updateItem.id)
            ])
            .upsertAsync({
              companyId: 1,
              name: updateItem.name,
              type: updateItem.type,
              isExport: updateItem.isExport,
              isDisabled: updateItem.isDisabled,
              erpSyncCode: updateItem.id
            });
        }

        this._toast.success("동기화가 완료 되었습니다.");
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
  }*/

  /* private async _syncEquipment(): Promise<void> {
     try {
       await this._orm.connectAsync(MainDbContext, async db => {
         const lastSyncDateTime = (await db.erpSync.where(item => [sorm.equal(item.code, "Equipment")]).singleAsync())!.syncDate;
         let updateErpEquipmentList: any[] = [];

         updateErpEquipmentList = await db.executeAsync([
           `SELECT * FROM OPENQUERY (MySQL_TS, 'SELECT * FROM Equipment WHERE modifyDate > ''${lastSyncDateTime}'' ')`
         ]);

         await db.erpSync
           .where(item =>
             [sorm.equal(item.code, "Equipment")]
           )
           .updateAsync(item => ({
             syncDate: new DateTime()
           }));

         for (const updateItem of updateErpEquipmentList[0]) {
           await db.equipment
             .where(item => [
               sorm.equal(item.erpSyncCode, updateItem.id)
             ])
             .upsertAsync({
               companyId: 1,
               name: updateItem.name,
               seq: updateItem.seq,
               code: updateItem.code,
               isCount: updateItem.isCehck,
               isDisabled: updateItem.isDisabled,
               erpSyncCode: updateItem.id,
               createdByEmployeeId: this._appData.authInfo!.employeeId,
               createdAtDateTime: updateItem.modifyDate
             });
         }

         this._toast.success("동기화가 완료 되었습니다.");
       });
     }
     catch (err) {
       this._toast.danger(err.message);
       if (process.env.NODE_ENV !== "production") console.error(err);
     }
   }*/
}

interface IAlarmVM {
  id: number;
  category: "이슈";
  task: "등록" | "수정" | "답변등록" | "답변수정" | "프로젝트" | "담당자" | "상태" | "선행이슈";
  itemId: number;
  createdByEmployeeName: string;
  createdAtDateTime: DateTime;
}
