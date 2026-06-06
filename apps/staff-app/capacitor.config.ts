import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for the Blancbeu Staff native Android app.
 */
const config: CapacitorConfig = {
	appId: 'in.bewell.staff',
	appName: 'BeWell Staff',
	// The Live Wrapper Configuration
	webDir: 'www',
	server: {
		url: process.env.CAPACITOR_SERVER_URL || 'https://staff.bewellfamilysalon.in',
		cleartext: true,
		errorPath: 'offline.html',
		allowNavigation: [
			'bewellfamilysalon.in',
			'*.bewellfamilysalon.in',
			'accounts.google.com',
			'*.firebaseapp.com'
		]
	},

	android: {
		allowMixedContent: false,
		// This user agent triggers the auto-redirect to /staff
		appendUserAgent: 'BlancbeuStaffNative'
	},

	plugins: {
		FirebaseAuthentication: {
			skipNativeAuth: false,
			providers: ['google.com']
		},
		PushNotifications: {
			// Don't include 'sound' — we play our own in-app notification sound
			// in the pushNotificationReceived handler. Including 'sound' here
			// causes the OS to also play system sound, leading to duplicate sounds.
			presentationOptions: ['badge', 'alert']
		},
		LocalNotifications: {
			smallIcon: 'ic_stat_notification',
			iconColor: '#7c3aed'
		},
		StatusBar: {
			overlaysWebView: false,
			style: 'LIGHT', // Light style = dark text/icons
			backgroundColor: '#f8fafc' // Initial light background
		}
	},

	includePlugins: [
		'@capacitor-firebase/authentication',
		'@capacitor/push-notifications',
		'@capacitor/app',
		'@capacitor/browser',
		'@capacitor/status-bar',
		'@capacitor/share',
		'@capacitor/filesystem'
	]
};

export default config;
