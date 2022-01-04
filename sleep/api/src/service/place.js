/**
 * Manages logic related to places
 * @author mtownsend
 * @since December 29, 2021
 * @flow
 **/
import { v4 as uuid } from 'uuid';
import collection, { sanitise } from './db.js';

import type { Tagged } from '../util.js';

// TODO: Share type definitions with app
export type PlaceId = string;
export type Place = {|
  id: PlaceId,
  owner: string,
  name: string,
  photo?: string,
  amenities: Array<Amenity>,
  bookings: Array<Booking>
|};

export type AmenityType = 'sleeps' | 'heated';

export type Amenity = {|
  type: AmenityType,
  value?: any
|};

export type BookingId = string;

export type Booking = {|
  id: BookingId,
  start:Date,
  end:Date,
  status: 'pending' | 'approved' | 'denied',
  guestId: string
|};

const COLLECTION = 'place';

const withTags = (place:Place):Tagged<Place> => ({
  ...place,
  tags: [] // TODO
});

export const getPlaces = async ():Promise<Array<Tagged<Place>>> => {
  const col = await collection(COLLECTION);
  const places = await col.find();
  return (await places.toArray())
    .map(sanitise)
    .map(withTags);
};

export const getBookings = async (userEmail:string): Promise<Array<Tagged<Place>>> => {
  const col = await collection(COLLECTION);
  const places = await col.find({ "bookings.guestId": userEmail });
  return (await places.toArray())
    .map(sanitise)
    .map(withTags);
};

export const getPlace = async (id:PlaceId):Promise<?Tagged<Place>> => {
  const col = await collection(COLLECTION);
  const place = await col.findOne({ id });
  return !place ? null : withTags(place);
};

export const reservePlace = async (placeId:PlaceId, booking:Booking):Promise<Booking> => {
  const col = await collection(COLLECTION);
  // TODO: Validate the reservation
  booking.id = uuid();
  if (!requiresApproval(placeId, booking)) {
    booking.status = 'approved';
  }
  await col.updateOne({ id: placeId }, { $push: { bookings: booking }});
  return booking;
};

export const cancelReservation = async(placeId:PlaceId, bookingId:BookingId):Promise<void> => {
  const col = await collection(COLLECTION);
  await col.updateOne({ id: placeId }, { $pull: { bookings: { id: bookingId }}});
};

export const createPlace = async (input: any):Promise<Tagged<Place>> => {
  
  if (!input.name) {
    throw 'Invalid name';
  }

  const col = await collection(COLLECTION);
  const place = {
    id: uuid(),
    owner: input.owner,
    photo: input.photo,
    name: input.name,
    amenities: input.amenities || [],
    bookings: []
  };
  col.insert(place);

  return withTags(place)
};

export const requiresApproval = (placeId:PlaceId, booking:Booking):boolean => {
  // TODO: implement booking approval
  return false;
};