import { Component, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { UserDetails } from 'src/app/shared/dto/user';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  onAuthChangeSubscription: Subscription;
  userList: UserDetails[] = [];

  private barChart: am4charts.XYChart;
  private donutChart: am4charts.PieChart;

  constructor(private auth: AuthService, private router: Router, private api: ApiService, @Inject(PLATFORM_ID) private platformId, private zone: NgZone) { }

  browserOnly(f: () => void) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        f();
      });
    }
  }

  ngOnInit() {
    this.onAuthChangeSubscription = this.auth.onAuthChange.subscribe((authState) => {
      if (!authState.loggedIn) {
        if (authState.tokenExpired) {
          console.log("Token has expired.");
        } else {
          this.onLoggedOut();
        }
      }
    });

    this.getData();
  }

  ngAfterViewInit() {
    this.browserOnly(() => {
      this.getData();
    });
  }

  getData() {
    this.api.getDataFromDashboard().subscribe(
      res => {
        this.userList = res.tableUsers;

        am4core.useTheme(am4themes_animated);

        this.donutChart = am4core.create("donutChart", am4charts.PieChart);
        this.barChart = am4core.create("barChart", am4charts.XYChart);

        let pieSeries = this.donutChart.series.push(new am4charts.PieSeries());
        pieSeries.dataFields.value = "value";
        pieSeries.dataFields.category = "name";

        this.donutChart.innerRadius = am4core.percent(30);

        pieSeries.slices.template.stroke = am4core.color("#fff");
        pieSeries.slices.template.strokeWidth = 2;
        pieSeries.slices.template.strokeOpacity = 1;
        pieSeries.slices.template.cursorOverStyle = [
          {
            "property": "cursor",
            "value": "pointer"
          }
        ];

        pieSeries.alignLabels = false;
        pieSeries.labels.template.bent = true;
        pieSeries.labels.template.radius = 3;
        pieSeries.labels.template.padding(0, 0, 0, 0);

        pieSeries.ticks.template.disabled = true;

        let shadow = pieSeries.slices.template.filters.push(new am4core.DropShadowFilter);
        shadow.opacity = 0;

        let hoverState = pieSeries.slices.template.states.getKey("hover");

        let hoverShadow = hoverState.filters.push(new am4core.DropShadowFilter);
        hoverShadow.opacity = 0.7;
        hoverShadow.blur = 5;

        this.donutChart.legend = new am4charts.Legend();

        this.donutChart.data = res.chartDonut;

        // Bar Chart
        this.barChart.data = res.chartBar;

        let categoryAxis = this.barChart.xAxes.push(new am4charts.CategoryAxis());
        categoryAxis.dataFields.category = "name";
        categoryAxis.renderer.grid.template.location = 0;
        categoryAxis.renderer.minGridDistance = 30;

        categoryAxis.renderer.labels.template.adapter.add("dy", function (dy, target) {
          return dy;
        });

        let valueAxis = this.barChart.yAxes.push(new am4charts.ValueAxis());
        let series = this.barChart.series.push(new am4charts.ColumnSeries());
        series.dataFields.valueY = "value";
        series.dataFields.categoryX = "name";
        series.name = "Name";
        series.columns.template.tooltipText = "{categoryX}: [bold]{valueY}[/]";
        series.columns.template.fillOpacity = .8;

        let columnTemplate = series.columns.template;
        columnTemplate.strokeWidth = 2;
        columnTemplate.strokeOpacity = 1;

      },
      err => {
        console.log("FAILED: Get data from dashboard -> ", err);
      }
    );
  }

  onSignOutClicked() {
    this.auth.logout();
  }

  onLoggedOut() {
    this.onAuthChangeSubscription.unsubscribe();
    this.router.navigate(['login']);
  }

  ngOnDestroy() {
    this.browserOnly(() => {
      if (this.donutChart) {
        this.donutChart.dispose();
      }

      if (this.barChart) {
        this.barChart.dispose();
      }
    });
  }

}
