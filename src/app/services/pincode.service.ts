import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LocationData {
  city: string;
  state: string;
  country: string;
  district?: string;
  region?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PincodeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.APIUrl}/pincodes`;

  getLocationByPincode(pincode: string): Observable<LocationData | null> {
    if (!pincode || pincode.length !== 6 || !/^\d+$/.test(pincode)) {
      return of(null);
    }

    return this.http.get<any>(`${this.apiUrl}/lookup/${pincode}`).pipe(
      map(response => response.data || null),
      catchError(() => of(null))
    );
  }

  // Fallback local database for major cities
  private pincodeDatabase: { [key: string]: LocationData } = {
    // Delhi
    '110001': { city: 'New Delhi', state: 'Delhi', country: 'India' },
    '110002': { city: 'New Delhi', state: 'Delhi', country: 'India' },
    '110003': { city: 'New Delhi', state: 'Delhi', country: 'India' },
    '110004': { city: 'New Delhi', state: 'Delhi', country: 'India' },
    '110005': { city: 'New Delhi', state: 'Delhi', country: 'India' },
    '110006': { city: 'New Delhi', state: 'Delhi', country: 'India' },
    '110007': { city: 'New Delhi', state: 'Delhi', country: 'India' },
    '110008': { city: 'New Delhi', state: 'Delhi', country: 'India' },
    '110009': { city: 'New Delhi', state: 'Delhi', country: 'India' },
    '110010': { city: 'New Delhi', state: 'Delhi', country: 'India' },
    // Mumbai
    '400001': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    '400002': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    '400003': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    '400004': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    '400005': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    '400006': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    '400007': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    '400008': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    '400009': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    '400010': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    // Bangalore
    '560001': { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    '560002': { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    '560003': { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    '560004': { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    '560005': { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    '560006': { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    '560007': { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    '560008': { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    '560009': { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    '560010': { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    // Hyderabad
    '500001': { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    '500002': { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    '500003': { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    '500004': { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    '500005': { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    '500006': { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    '500007': { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    '500008': { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    '500009': { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    '500010': { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    // Chennai
    '600001': { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    '600002': { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    '600003': { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    '600004': { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    '600005': { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    '600006': { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    '600007': { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    '600008': { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    '600009': { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    '600010': { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    // Pune
    '411001': { city: 'Pune', state: 'Maharashtra', country: 'India' },
    '411002': { city: 'Pune', state: 'Maharashtra', country: 'India' },
    '411003': { city: 'Pune', state: 'Maharashtra', country: 'India' },
    '411004': { city: 'Pune', state: 'Maharashtra', country: 'India' },
    '411005': { city: 'Pune', state: 'Maharashtra', country: 'India' },
    '411006': { city: 'Pune', state: 'Maharashtra', country: 'India' },
    '411007': { city: 'Pune', state: 'Maharashtra', country: 'India' },
    '411008': { city: 'Pune', state: 'Maharashtra', country: 'India' },
    '411009': { city: 'Pune', state: 'Maharashtra', country: 'India' },
    '411010': { city: 'Pune', state: 'Maharashtra', country: 'India' },
    // Kolkata
    '700001': { city: 'Kolkata', state: 'West Bengal', country: 'India' },
    '700002': { city: 'Kolkata', state: 'West Bengal', country: 'India' },
    '700003': { city: 'Kolkata', state: 'West Bengal', country: 'India' },
    '700004': { city: 'Kolkata', state: 'West Bengal', country: 'India' },
    '700005': { city: 'Kolkata', state: 'West Bengal', country: 'India' },
    '700006': { city: 'Kolkata', state: 'West Bengal', country: 'India' },
    '700007': { city: 'Kolkata', state: 'West Bengal', country: 'India' },
    '700008': { city: 'Kolkata', state: 'West Bengal', country: 'India' },
    '700009': { city: 'Kolkata', state: 'West Bengal', country: 'India' },
    '700010': { city: 'Kolkata', state: 'West Bengal', country: 'India' },
  };

  // Local fallback for cities
  getAllCities(): string[] {
    const cities = new Set<string>();
    Object.values(this.pincodeDatabase).forEach(loc => cities.add(loc.city));
    return Array.from(cities).sort();
  }

  getAllStates(): string[] {
    const states = new Set<string>();
    Object.values(this.pincodeDatabase).forEach(loc => states.add(loc.state));
    return Array.from(states).sort();
  }

  getAllCountries(): string[] {
    const countries = new Set<string>();
    Object.values(this.pincodeDatabase).forEach(loc => countries.add(loc.country));
    return Array.from(countries).sort();
  }
}
