import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

import { CompareData } from './compare-data.model';
import { AuthService } from '../user/auth.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable()
export class CompareService {
  dataEdited = new BehaviorSubject<boolean>(false);
  dataIsLoading = new BehaviorSubject<boolean>(false);
  dataLoaded = new Subject<CompareData[]>();
  dataLoadFailed = new Subject<boolean>();
  userData: CompareData;

  constructor(private http: HttpClient,
              private authService: AuthService) {
  }

  onStoreData(data: CompareData) {
    this.dataLoadFailed.next(false);
    this.dataIsLoading.next(true);
    this.dataEdited.next(false);
    this.userData = data;

    this.authService.getAuthenticatedUser().getSession((err, session) => {
      if (err) {
        console.log(err);
      } else {
        this.http.post('https://lru1rsqo2m.execute-api.us-east-1.amazonaws.com/dev/compare-yourself/', data, {
          headers: new HttpHeaders().set('Authorization', session.getIdToken().getJwtToken())
        })
          .subscribe(
            (result) => {
              this.dataLoadFailed.next(false);
              this.dataIsLoading.next(false);
              this.dataEdited.next(true);
            },
            (error) => {
              this.dataIsLoading.next(false);
              this.dataLoadFailed.next(true);
              this.dataEdited.next(false);
            }
          );
      }
    });
  }
  onRetrieveData(all = true) {
    this.dataLoaded.next(null);
    this.dataLoadFailed.next(false);
    this.authService.getAuthenticatedUser().getSession((err, session) => {

      if (err) {
        console.log(err);
      } else {
        let urlParam = 'all';

        if (!all) {
          urlParam = 'single';
        }

        this.http.get<CompareData[]>(
          'https://lru1rsqo2m.execute-api.us-east-1.amazonaws.com/dev/compare-yourself/' + urlParam,
          {
            headers: new HttpHeaders().set('Authorization', session.getIdToken().getJwtToken()),
            params: new HttpParams().set('accessToken', session.getAccessToken().getJwtToken())
          }
        ).subscribe(
          (data) => {
            if (all) {
              this.dataLoaded.next(data);
            } else {
              console.log(data);
              if (!data.length) {
                this.dataLoadFailed.next(true);
                return;
              }
              this.userData = data[0];
              this.dataEdited.next(true);
            }
          },
          (error) => {
            this.dataLoadFailed.next(true);
            this.dataLoaded.next(null);
          }
        );
      }
    });
  }
  onDeleteData() {
    this.dataLoadFailed.next(false);

    this.authService.getAuthenticatedUser().getSession((err, session) => {
      if (err) {
        console.log(err);
      } else {
        this.http.delete('https://lru1rsqo2m.execute-api.us-east-1.amazonaws.com/dev/compare-yourself/',
          {
            headers: new HttpHeaders().set('Authorization', session.getIdToken().getJwtToken()),
          })
          .subscribe(
            (data) => {
              console.log(data);
            },
            (error) => this.dataLoadFailed.next(true)
          );
      }
    });


  }
}
