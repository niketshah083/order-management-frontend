import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface ApiInternalUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  role: 'super_admin' | 'manager';
  distributorIds?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface InternalUserResponse {
  statusCode: number;
  data: ApiInternalUser[];
}

export interface CreateInternalUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  password: string;
  role: 'super_admin' | 'manager';
  distributorIds?: number[];
}

@Injectable({ providedIn: 'root' })
export class InternalUserService {
  private http = inject(HttpClient) as HttpClient;
  private auth = inject(AuthService);
  private readonly API_URL = environment.APIUrl;

  getInternalUsers(): Observable<InternalUserResponse> {
    return this.http.get<InternalUserResponse>(this.API_URL + '/internal-users', {
      
    });
  }

  createInternalUser(payload: CreateInternalUserPayload): Observable<any> {
    return this.http.post(this.API_URL + '/internal-users', payload, {
      
    });
  }

  updateInternalUser(id: string, payload: Partial<CreateInternalUserPayload>): Observable<any> {
    return this.http.patch(`${this.API_URL}/internal-users/${id}`, payload, {
      
    });
  }

  deleteInternalUser(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/internal-users/${id}`, {
      
    });
  }
}
