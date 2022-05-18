/**
 * External dependencies
 */
import moment from 'moment';
import type { Moment } from 'moment';

/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../../button';
import ButtonGroup from '../../button-group';
import TimeZone from './timezone';
import type { TimePickerProps } from '../types';
import {
	Wrapper,
	Fieldset,
	Legend,
	hoursField,
	TimeSeparator,
	minutesField,
	MonthFieldWrapper,
	monthField as monthFieldStyles,
	dayField as dayFieldStyles,
	yearField,
	TimeWrapper,
} from './styles';
import { HStack } from '../../h-stack';
import { Spacer } from '../../spacer';
import { useCx } from '../../utils';
import NumberControl from '../../number-control';
import SelectControl from '../../select-control';
import type { InputChangeCallback } from '../../input-control/types';

const TIMEZONELESS_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

function from12hTo24h( hours: number, isPm: boolean ) {
	return isPm ? ( ( hours % 12 ) + 12 ) % 24 : hours % 12;
}

/**
 * TimePicker is a React component that renders a clock for time selection.
 *
 * ```jsx
 * import { TimePicker } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyTimePicker = () => {
 *   const [ time, setTime ] = useState( new Date() );
 *
 *   return (
 *     <TimePicker
 *       currentTime={ date }
 *       onChange={ ( newTime ) => setTime( newTime ) }
 *       is12Hour
 *     />
 *   );
 * };
 * ```
 */
export function TimePicker( {
	is12Hour,
	currentTime,
	onChange,
}: TimePickerProps ) {
	const [ date, setDate ] = useState( () =>
		// Truncate the date at the minutes, see: #15495.
		currentTime ? moment( currentTime ).startOf( 'minutes' ) : moment()
	);

	// Reset the state when currentTime changed.
	useEffect( () => {
		setDate(
			currentTime ? moment( currentTime ).startOf( 'minutes' ) : moment()
		);
	}, [ currentTime ] );

	const { day, month, year, minutes, hours, am } = useMemo(
		() => ( {
			day: date.format( 'DD' ),
			month: date.format( 'MM' ),
			year: date.format( 'YYYY' ),
			minutes: date.format( 'mm' ),
			hours: date.format( is12Hour ? 'hh' : 'HH' ),
			am: Number( date.format( 'H' ) ) <= 11 ? 'AM' : 'PM',
		} ),
		[ date, is12Hour ]
	);

	const cx = useCx();

	/**
	 * Function that sets the date state and calls the onChange with a new date.
	 * The date is truncated at the minutes.
	 *
	 * @param {Moment} newDate The date object.
	 */
	function changeDate( newDate: Moment ) {
		setDate( newDate );
		onChange?.( newDate.format( TIMEZONELESS_FORMAT ) );
	}

	const buildNumberControlChangeCallback = (
		method: 'date' | 'hours' | 'minutes' | 'year'
	) => {
		const callback: InputChangeCallback = ( value, { event } ) => {
			if ( ! ( event.target instanceof HTMLInputElement ) ) {
				return;
			}

			if ( ! event.target.validity.valid ) {
				return;
			}

			// We can safely assume value is a number if target is valid.
			let numberValue = Number( value );

			// If the 12-hour format is being used and the 'PM' period is
			// selected, then the incoming value (which ranges 1-12) should be
			// increased by 12 to match the expected 24-hour format.
			if ( method === 'hours' && is12Hour ) {
				numberValue = from12hTo24h( numberValue, am === 'PM' );
			}

			const newDate = date.clone()[ method ]( numberValue );
			setDate( newDate );
			onChange?.( newDate.format( TIMEZONELESS_FORMAT ) );
		};
		return callback;
	};

	function buildAmPmChangeCallback( value: 'AM' | 'PM' ) {
		return () => {
			if ( am === value ) {
				return;
			}

			const parsedHours = parseInt( hours, 10 );

			const newDate = date
				.clone()
				.hours( from12hTo24h( parsedHours, value === 'PM' ) );

			changeDate( newDate );
		};
	}

	const dayField = (
		<NumberControl
			className={ cx(
				'components-datetime__time-field-day-input',
				dayFieldStyles
			) }
			label={ __( 'Day' ) }
			hideLabelFromVision
			__next36pxDefaultSize
			value={ day }
			step={ 1 }
			min={ 1 }
			max={ 31 }
			hideHTMLArrows
			isPressEnterToChange
			isDragEnabled={ false }
			isShiftStepEnabled={ false }
			onChange={ buildNumberControlChangeCallback( 'date' ) }
		/>
	);

	const monthField = (
		<MonthFieldWrapper>
			<SelectControl
				className={ cx(
					'components-datetime__time-field-month-select',
					monthFieldStyles
				) }
				label={ __( 'Month' ) }
				hideLabelFromVision
				__nextHasNoMarginBottom
				value={ month }
				options={ [
					{ value: '01', label: __( 'January' ) },
					{ value: '02', label: __( 'February' ) },
					{ value: '03', label: __( 'March' ) },
					{ value: '04', label: __( 'April' ) },
					{ value: '05', label: __( 'May' ) },
					{ value: '06', label: __( 'June' ) },
					{ value: '07', label: __( 'July' ) },
					{ value: '08', label: __( 'August' ) },
					{ value: '09', label: __( 'September' ) },
					{ value: '10', label: __( 'October' ) },
					{ value: '11', label: __( 'November' ) },
					{ value: '12', label: __( 'December' ) },
				] }
				onChange={ ( value ) => {
					const newDate = date.clone().month( Number( value ) - 1 );
					setDate( newDate );
					onChange?.( newDate.format( TIMEZONELESS_FORMAT ) );
				} }
			/>
		</MonthFieldWrapper>
	);

	return (
		<Wrapper className="components-datetime__time">
			<Fieldset>
				<Legend className="components-datetime__time-legend">
					{ __( 'Time' ) }
				</Legend>
				<HStack className="components-datetime__time-wrapper">
					<TimeWrapper className="components-datetime__time-field components-datetime__time-field-time">
						<NumberControl
							className={ cx(
								'components-datetime__time-field-hours-input',
								hoursField
							) }
							label={ __( 'Hours' ) }
							hideLabelFromVision
							__next36pxDefaultSize
							value={ hours }
							step={ 1 }
							min={ is12Hour ? 1 : 0 }
							max={ is12Hour ? 12 : 23 }
							hideHTMLArrows
							isPressEnterToChange
							isDragEnabled={ false }
							isShiftStepEnabled={ false }
							onChange={ buildNumberControlChangeCallback(
								'hours'
							) }
						/>
						<TimeSeparator
							className="components-datetime__time-separator"
							aria-hidden="true"
						>
							:
						</TimeSeparator>
						<NumberControl
							className={ cx(
								'components-datetime__time-field-minutes-input',
								minutesField
							) }
							label={ __( 'Minutes' ) }
							hideLabelFromVision
							__next36pxDefaultSize
							value={ minutes }
							step={ 1 }
							min={ 0 }
							max={ 59 }
							hideHTMLArrows
							isPressEnterToChange
							isDragEnabled={ false }
							isShiftStepEnabled={ false }
							onChange={ buildNumberControlChangeCallback(
								'minutes'
							) }
						/>
					</TimeWrapper>
					{ is12Hour && (
						<ButtonGroup className="components-datetime__time-field components-datetime__time-field-am-pm">
							<Button
								className="components-datetime__time-am-button"
								variant={
									am === 'AM' ? 'primary' : 'secondary'
								}
								onClick={ buildAmPmChangeCallback( 'AM' ) }
							>
								{ __( 'AM' ) }
							</Button>
							<Button
								className="components-datetime__time-pm-button"
								variant={
									am === 'PM' ? 'primary' : 'secondary'
								}
								onClick={ buildAmPmChangeCallback( 'PM' ) }
							>
								{ __( 'PM' ) }
							</Button>
						</ButtonGroup>
					) }
					<Spacer />
					<TimeZone />
				</HStack>
			</Fieldset>
			<Fieldset>
				<Legend className="components-datetime__time-legend">
					{ __( 'Date' ) }
				</Legend>
				<HStack className="components-datetime__time-wrapper">
					{ is12Hour ? (
						<>
							{ monthField }
							{ dayField }
						</>
					) : (
						<>
							{ dayField }
							{ monthField }
						</>
					) }
					<NumberControl
						className={ cx(
							'components-datetime__time-field-year-input',
							yearField
						) }
						label={ __( 'Year' ) }
						hideLabelFromVision
						__next36pxDefaultSize
						value={ year }
						step={ 1 }
						hideHTMLArrows
						isPressEnterToChange
						isDragEnabled={ false }
						isShiftStepEnabled={ false }
						onChange={ buildNumberControlChangeCallback( 'year' ) }
					/>
				</HStack>
			</Fieldset>
		</Wrapper>
	);
}

export default TimePicker;
