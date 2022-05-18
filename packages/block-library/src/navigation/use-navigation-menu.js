/**
 * WordPress dependencies
 */
import {
	store as coreStore,
	useResourcePermissions,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function useNavigationMenu( ref ) {
	const entityDetails = useSelect(
		( select ) => {
			const {
				getEntityRecord,
				getEditedEntityRecord,
				getEntityRecords,
				hasFinishedResolution,
				isResolving,
			} = select( coreStore );

			const navigationMenuSingleArgs = [
				'postType',
				'wp_navigation',
				ref,
			];
			const rawNavigationMenu = ref
				? getEntityRecord( ...navigationMenuSingleArgs )
				: null;
			let navigationMenu = ref
				? getEditedEntityRecord( ...navigationMenuSingleArgs )
				: null;

			// getEditedEntityRecord will return the post regardless of status.
			// Therefore if the found post is not published then we should ignore it.
			if ( navigationMenu?.status !== 'publish' ) {
				navigationMenu = null;
			}

			const hasResolvedNavigationMenu = ref
				? hasFinishedResolution(
						'getEditedEntityRecord',
						navigationMenuSingleArgs
				  )
				: false;

			const navigationMenuMultipleArgs = [
				'postType',
				'wp_navigation',
				{ per_page: -1, status: 'publish' },
			];
			const navigationMenus = getEntityRecords(
				...navigationMenuMultipleArgs
			);

			const canSwitchNavigationMenu = ref
				? navigationMenus?.length > 1
				: navigationMenus?.length > 0;

			return {
				isNavigationMenuResolved: hasResolvedNavigationMenu,
				isNavigationMenuMissing:
					! ref ||
					( hasResolvedNavigationMenu && ! rawNavigationMenu ),
				canSwitchNavigationMenu,
				isResolvingNavigationMenus: isResolving(
					'getEntityRecords',
					navigationMenuMultipleArgs
				),
				hasResolvedNavigationMenus: hasFinishedResolution(
					'getEntityRecords',
					navigationMenuMultipleArgs
				),
				navigationMenu,
				navigationMenus,
			};
		},
		[ ref ]
	);

	const [
		hasResolvedPermissions,
		{ canCreate, canUpdate, canDelete, isResolving },
	] = useResourcePermissions( 'navigation', ref );

	return {
		...entityDetails,
		canUserCreateNavigationMenu: canCreate,
		hasResolvedCanUserCreateNavigationMenu: hasResolvedPermissions,
		isResolvingCanUserCreateNavigationMenu: isResolving,

		canUserDeleteNavigationMenu: canDelete,
		hasResolvedCanUserDeleteNavigationMenu: hasResolvedPermissions,

		canUserUpdateNavigationMenu: canUpdate,
		hasResolvedCanUserUpdateNavigationMenu: hasResolvedPermissions,
	};
}
