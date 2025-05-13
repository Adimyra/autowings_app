// frappe.ui.form.on('RTO Registration', {
//     refresh: function(frm) {
//         // Check if rto_activity child table has rows
//         if (frm.doc.rto_activity && frm.doc.rto_activity.length > 0) {
//             // Add custom button to the form
//             frm.add_custom_button(__('View Activities'), function() {
//                 // Create a new dialog (modal) with large size
//                 let dialog = new frappe.ui.Dialog({
//                     title: __('RTO Activity Log'),
//                     size: 'large', // Set modal size to large
//                     fields: [
//                         {
//                             fieldtype: 'HTML',
//                             fieldname: 'activity_table',
//                             options: generate_activity_table(frm)
//                         }
//                     ],
//                     primary_action_label: __('Close'),
//                     primary_action: function() {
//                         dialog.hide();
//                     }
//                 });

//                 // Add a unique class to this modal for targeted styling
//                 dialog.$wrapper.addClass('rto-activity-modal');

//                 // Add custom CSS for this specific modal and table styling
//                 dialog.$wrapper.find('.modal-content').prepend(`
//                     <style>
//                         /* Target only this modal */
//                         .rto-activity-modal .modal-dialog {
//                             max-width: 100vw !important; /* Full width */
//                             width: 100% !important;
//                             margin: 0 !important;
//                         }
//                         .rto-activity-modal .modal-content {
//                             display: flex;
//                             flex-direction: column;
//                             height: 100vh; /* Full height */
//                             border-radius: 0; /* Remove border radius for full-screen effect */
//                         }
//                         .rto-activity-modal .modal-body {
//                             flex: 1; /* Take remaining space */
//                             overflow-y: auto; /* Scrollable content */
//                             padding: 20px;
//                         }
//                         .rto-activity-modal .modal-header,
//                         .rto-activity-modal .modal-footer {
//                             flex-shrink: 0; /* Prevent header/footer from shrinking */
//                             padding: 15px 20px;
//                         }
//                         .activity-table {
//                             width: 100%;
//                             table-layout: auto;
//                             border-collapse: collapse;
//                         }
//                         .activity-table th, .activity-table td {
//                             padding: 10px;
//                             text-align: left;
//                             vertical-align: middle;
//                             word-wrap: break-word;
//                             border: 1px solid #ddd;
//                         }
//                         .activity-table th {
//                             background-color: #f4f4f4;
//                             font-weight: bold;
//                             position: sticky;
//                             top: 0;
//                             z-index: 1;
//                         }
//                         .status-error {
//                             color: #d9534f; /* Red for error */
//                         }
//                         .status-success {
//                             color: #5cb85c; /* Green for success */
//                         }
//                         .status-danger {
//                             color: #f0ad4e; /* Orange for other statuses */
//                         }
//                         .remarks-yellow {
//                             background-color: #fff3cd; /* Yellow background for remarks */
//                             display: block;
//                             padding: 4px;
//                             border-radius: 3px;
//                         }
//                         .latest-activity {
//                             color: #5cb85c; /* Green for the latest activity */
//                             font-weight: bold; /* Optional: make it stand out more */
//                         }
//                     </style>
//                 `);
//                 dialog.show();
//             });
//         }
//     }
// });

// // Function to generate HTML table for activities in descending order
// function generate_activity_table(frm) {
//     // Sort activities in descending order based on update_on
//     let sorted_activities = frm.doc.rto_activity.slice().sort((a, b) => {
//         return new Date(b.update_on) - new Date(a.update_on);
//     });

//     let html = `
//         <table class="table table-bordered activity-table">
//             <thead>
//                 <tr>
//                     <th>Activity</th>
//                     <th>Status</th>
//                     <th>Updated By</th>
//                     <th>Updated On</th>
//                     <th>Remarks</th>
//                 </tr>
//             </thead>
//             <tbody>
//     `;
    
//     sorted_activities.forEach((row, index) => {
//         // Determine status class based on status value
//         let status_class = 'status-danger'; // Default to orange
//         if (row.status === 'Application Verification Skipped') {
//             status_class = 'status-error'; // Red for error
//         } else if (['Application Verified', 'Payment Recorded', 'Registration Updated', 'Application Details Updated', 'Journals and Smart Cards Updated'].includes(row.status)) {
//             status_class = 'status-success'; // Green for success
//         }

//         // Format update_on date
//         let update_on = frappe.datetime.str_to_user(row.update_on);

//         // Handle remarks (empty or yellow background)
//         let remarks = row.remarks ? `<span class="remarks-yellow">${frappe.utils.escape_html(row.remarks)}</span>` : '-';

//         // Apply latest-activity class to the first row (most recent)
//         let row_class = index === 0 ? 'latest-activity' : '';

//         html += `
//             <tr class="${row_class}">
//                 <td>${frappe.utils.escape_html(row.activity)}</td>
//                 <td class="${status_class}">${frappe.utils.escape_html(row.status)}</td>
//                 <td>${frappe.utils.escape_html(row.user)}</td>
//                 <td>${update_on}</td>
//                 <td>${remarks}</td>
//             </tr>
//         `;
//     });

//     html += '</tbody></table>';
//     return html;
// }

frappe.ui.form.on('RTO Registration', {
    refresh: function(frm) {
        // Check if rto_activity child table has rows
        if (frm.doc.rto_activity && frm.doc.rto_activity.length > 0) {
            // Add custom button to the form
            frm.add_custom_button(__('View Activities'), function() {
                // Create a new dialog (modal) with large size
                let dialog = new frappe.ui.Dialog({
                    title: __('RTO Activity Timeline'),
                    size: 'large',
                    fields: [
                        {
                            fieldtype: 'HTML',
                            fieldname: 'activity_timeline',
                            options: generate_activity_timeline(frm)
                        }
                    ],
                    primary_action_label: __('Close'),
                    primary_action: function() {
                        dialog.hide();
                    }
                });

                // Add a unique class to this modal for targeted styling
                dialog.$wrapper.addClass('rto-activity-modal');

                // Add custom CSS for this specific modal and timeline styling
                dialog.$wrapper.find('.modal-content').prepend(`
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
                    <style>
                        .rto-activity-modal .modal-dialog {
                            max-width: 800px !important;
                            width: 90% !important;
                            margin: 30px auto !important;
                        }
                        .rto-activity-modal .modal-content {
                            border-radius: 8px;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                        }
                        .rto-activity-modal .modal-body {
                            padding: 20px;
                            overflow-y: auto;
                            max-height: 70vh;
                            display: flex;
                            flex-direction: column;
                            gap: 1.5rem;
                        }
                        .timeline {
                            position: relative;
                            padding: 20px 0;
                            list-style: none;
                            width: 100%;
                        }
                        .timeline:before {
                            content: '';
                            position: absolute;
                            top: 0;
                            bottom: 0;
                            width: 4px;
                            background: #e9ecef;
                            left: 30px;
                            margin: 0;
                            border-radius: 2px;
                        }
                        .timeline-item {
                            position: relative;
                            margin-bottom: 40px;
                            padding-left: 60px;
                        }
                        .timeline-icon {
                            position: absolute;
                            left: 20px;
                            top: 50%;
                            transform: translateY(-50%);
                            width: 20px;
                            height: 20px;
                            border-radius: 50%;
                            border: none;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 1;
                            animation: pulse 1.5s ease-in-out infinite;
                            transition: transform 0.2s ease, box-shadow 0.2s ease;
                        }
                        .timeline-icon.status-error {
                            background-color: #d9534f;
                        }
                        .timeline-icon.status-success {
                            background-color: #5cb85c;
                        }
                        .timeline-icon.status-danger {
                            background-color: #f0ad4e;
                        }
                        .latest-activity .timeline-icon {
                            width: 24px;
                            height: 24px;
                            animation: strong-pulse 1.5s ease-in-out infinite;
                        }
                        .timeline-icon:hover {
                            transform: translateY(-50%) scale(1.2);
                            box-shadow: 0 0 8px rgba(0,0,0,0.3);
                        }
                        @keyframes pulse {
                            0% { transform: translateY(-50%) scale(1); }
                            50% { transform: translateY(-50%) scale(1.1); }
                            100% { transform: translateY(-50%) scale(1); }
                        }
                        @keyframes strong-pulse {
                            0% { transform: translateY(-50%) scale(1); }
                            50% { transform: translateY(-50%) scale(1.15); }
                            100% { transform: translateY(-50%) scale(1); }
                        }
                        .card {
                            background-color: #ffffff;
                            border-radius: 0.5rem;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            padding: 1.5rem;
                            width: 100%;
                            position: relative;
                            border-left: 4px solid;
                            transition: transform 0.2s ease, box-shadow 0.2s ease;
                        }
                        .card:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
                        }
                        .card.status-success {
                            background-color: #f0fdf4;
                            border-left-color: #5cb85c;
                        }
                        .card.status-error {
                            background-color: #fef2f2;
                            border-left-color: #d9534f;
                        }
                        .card.status-danger {
                            background-color: #fff7ed;
                            border-left-color: #f0ad4e;
                        }
                        .card h2 {
                            font-size: 1.25rem;
                            font-weight: 600;
                            color: #1f2937;
                            margin-bottom: 0.5rem;
                            display: flex;
                            align-items: center;
                        }
                        .card h2 i {
                            margin-right: 0.5rem;
                        }
                        .card .info {
                            display: flex;
                            align-items: center;
                            margin-bottom: 0.5rem;
                        }
                        .card .info.remarks {
                            align-items: flex-start;
                            flex-wrap: nowrap;
                        }
                        .card .info.remarks i {
                            margin-top: 0.25rem;
                            flex-shrink: 0;
                        }
                        .card .info i {
                            margin-right: 0.5rem;
                            flex-shrink: 0;
                        }
                        .card .label {
                            color: #4b5563;
                            font-weight: 500;
                        }
                        .card .value {
                            margin-left: 0.5rem;
                            color: #374151;
                            flex: 1;
                        }
                        .card .status-success {
                            color: #5cb85c;
                        }
                        .card .status-error {
                            color: #d9534f;
                        }
                        .card .status-danger {
                            color: #f0ad4e;
                        }
                        .card .icon-success {
                            color: #5cb85c;
                        }
                        .card .icon-error {
                            color: #d9534f;
                        }
                        .card .icon-danger {
                            color: #f0ad4e;
                        }
                        .card .remarks p {
                            margin: 0;
                            color: #374151;
                            background-color: #fff3cd;
                            padding: 4px 8px;
                            border-radius: 3px;
                            display: inline-block;
                            word-break: break-word;
                            flex: 1;
                        }
                        .latest-activity .card {
                            border-left-width: 6px;
                        }
                        .progress-bar-container {
                            width: 100%;
                            margin-bottom: 1.5rem;
                            background-color: #ffffff;
                            border-radius: 0.5rem;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            padding: 1rem;
                        }
                        .progress-bar-container h2 {
                            font-size: 1.25rem;
                            font-weight: 600;
                            color: #1f2937;
                            margin-bottom: 0.5rem;
                            display: flex;
                            align-items: center;
                        }
                        .progress-bar-container h2 i {
                            margin-right: 0.5rem;
                            color: #5cb85c;
                        }
                        .progress-bar {
                            height: 20px;
                            background: #e9ecef;
                            border-radius: 10px;
                            overflow: hidden;
                            position: relative;
                        }
                        .progress-bar-fill {
                            height: 100%;
                            background: linear-gradient(90deg, #5cb85c, #7ed321);
                            width: 0;
                            animation: fill-progress 1.5s ease forwards;
                            position: relative;
                            overflow: hidden;
                        }
                        .progress-bar-fill::after {
                            content: '';
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 200%;
                            height: 100%;
                            background: linear-gradient(
                                45deg,
                                rgba(255,255,255,0.2) 25%,
                                transparent 25%,
                                transparent 50%,
                                rgba(255,255,255,0.2) 50%,
                                rgba(255,255,255,0.2) 75%,
                                transparent 75%,
                                transparent
                            );
                            background-size: 30px 30px;
                            animation: shimmer 2s linear infinite;
                        }
                        @keyframes fill-progress {
                            to { width: var(--progress-width); }
                        }
                        @keyframes shimmer {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(100%); }
                        }
                    </style>
                `);
                dialog.show();
            });
        }
    }
});

// Function to generate timeline HTML with progress bar
function generate_activity_timeline(frm) {
    // Sort activities in descending order based on update_on
    let sorted_activities = frm.doc.rto_activity.slice().sort((a, b) => {
        return new Date(b.update_on) - new Date(a.update_on);
    });

    // Calculate progress percentage based on document status
    let progress_percentage = 0;
    switch (frm.doc.status) {
        case 'Due Application Entry':
            progress_percentage = 10;
            break;
        case 'Required Update':
            progress_percentage = 5;
            break;
        case 'Due Verification of Application':
            progress_percentage = 20;
            break;
        case 'Due Payment to RTO':
            progress_percentage = 30;
            break;
        case 'Due Registration Number Entry':
            progress_percentage = 40;
            break;
        case 'Due Number Plate Ordering':
            progress_percentage = 50;
            break;
        case 'Number Plate Not Received':
            progress_percentage = 60;
            break;
        case 'Due Number Plate Installation':
            progress_percentage = 70;
            break;
        case "Due Documents Submission to DTO":
            progress_percentage = 80;
            break;
        case 'Documents Not Received from DTO':
            progress_percentage = 85;
            break;
        case 'Due Scanning RC':
            progress_percentage = 90;
            break;
        case 'Due Handover to Customer':
            progress_percentage = 95;
            break;
        case 'Completed':
            progress_percentage = 100;
            break;
        default:
            progress_percentage = 0;
    }

    // Show progress bar with calculated percentage
    let progressBarHtml = `
        <div class="progress-bar-container">
            <h2><i class="fas fa-check-circle"></i> Progress: ${progress_percentage}%</h2>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="--progress-width: ${progress_percentage}%"></div>
            </div>
        </div>
    `;

    let html = `
        ${progressBarHtml}
        <ul class="timeline">
    `;

    sorted_activities.forEach((row, index) => {
        // Determine status class based on status value
        let status_class = 'status-danger';
        if (row.status === 'Application Verification Skipped') {
            status_class = 'status-error';
        } else if ([
            'Application Verified',
            'Payment Recorded',
            'Registration Updated',
            'Application Details Updated',
            'Journals and Smart Cards Updated',
            'Order Placed',
            'Receipt Confirmed',
            'Installation Completed',
            'Process Completed',
            'Handover Completed',
            'Document Attached',
            'Submission Completed',
        ].includes(row.status)) {
            status_class = 'status-success';
        }

        // Format update_on date
        let update_on = frappe.datetime.str_to_user(row.update_on);

        // Handle remarks
        let remarks = row.remarks ? `
            <div class="info remarks">
                <i class="fas fa-comment icon-${status_class}"></i>
                <span class="label">Remarks:</span>
                <div class="value">
                    <p>${frappe.utils.escape_html(row.remarks)}</p>
                </div>
            </div>
        ` : '';

        // Apply latest-activity class to the first row
        let row_class = index === 0 ? 'latest-activity' : '';

        html += `
            <li class="timeline-item ${status_class} ${row_class}">
                <div class="timeline-icon ${status_class}"></div>
                <div class="card ${status_class}">
                    <h2>
                        ${frappe.utils.escape_html(row.activity)}
                    </h2>
                    <div class="info">
                        <i class="fas fa-check-circle icon-${status_class}"></i>
                        <span class="label">Status:</span>
                        <span class="value ${status_class}">${frappe.utils.escape_html(row.status)}</span>
                    </div>
                    <div class="info">
                        <i class="fas fa-calendar-alt icon-${status_class}"></i>
                        <span class="label">Updated On:</span>
                        <span class="value">${update_on}</span>
                    </div>
                    <div class="info">
                        <i class="fas fa-user icon-${status_class}"></i>
                        <span class="label">Updated By:</span>
                        <span class="value">${frappe.utils.escape_html(row.user)}</span>
                    </div>
                    ${remarks}
                </div>
            </li>
        `;
    });

    html += '</ul>';
    return html;
}

// frappe.ui.form.on('RTO Registration', {
//     refresh: function(frm) {
//         // Check if rto_activity child table has rows
//         if (frm.doc.rto_activity && frm.doc.rto_activity.length > 0) {
//             // Add custom button to the form
//             frm.add_custom_button(__('View Activities'), function() {
//                 // Create a new dialog (modal) with large size
//                 let dialog = new frappe.ui.Dialog({
//                     title: __('RTO Activity Timeline'),
//                     size: 'large',
//                     fields: [
//                         {
//                             fieldtype: 'HTML',
//                             fieldname: 'activity_timeline',
//                             options: generate_activity_timeline(frm)
//                         }
//                     ],
//                     primary_action_label: __('Close'),
//                     primary_action: function() {
//                         dialog.hide();
//                     }
//                 });

//                 // Add a unique class to this modal for targeted styling
//                 dialog.$wrapper.addClass('rto-activity-modal');

//                 // Add custom CSS for this specific modal and timeline styling
//                 dialog.$wrapper.find('.modal-content').prepend(`
//                     <style>
//                         .rto-activity-modal .modal-dialog {
//                             max-width: 800px !important;
//                             width: 90% !important;
//                             margin: 30px auto !important;
//                         }
//                         .rto-activity-modal .modal-content {
//                             border-radius: 8px;
//                             box-shadow: 0 4px 20px rgba(0,0,0,0.1);
//                         }
//                         .rto-activity-modal .modal-body {
//                             padding: 20px;
//                             overflow-y: auto;
//                             max-height: 70vh;
//                         }
//                         .timeline {
//                             position: relative;
//                             padding: 20px 0;
//                             list-style: none;
//                         }
//                         .timeline:before {
//                             content: '';
//                             position: absolute;
//                             top: 0;
//                             bottom: 0;
//                             width: 4px;
//                             background: #e9ecef;
//                             left: 30px;
//                             margin: 0;
//                             border-radius: 2px;
//                         }
//                         .timeline-item {
//                             position: relative;
//                             margin-bottom: 20px;
//                             padding-left: 60px;
//                         }
//                         .timeline-icon {
//                             position: absolute;
//                             left: 20px;
//                             top: 5px;
//                             width: 20px;
//                             height: 20px;
//                             border-radius: 50%;
//                             background: #fff;
//                             border: 3px solid;
//                             display: flex;
//                             align-items: center;
//                             justify-content: center;
//                         }
//                         .status-error .timeline-icon { border-color: #d9534f; }
//                         .status-success .timeline-icon { border-color: #5cb85c; }
//                         .status-danger .timeline-icon { border-color: #f0ad4e; }
//                         .timeline-content {
//                             background: #fff;
//                             padding: 15px;
//                             border-radius: 6px;
//                             box-shadow: 0 2px 8px rgba(0,0,0,0.05);
//                             position: relative;
//                             transition: transform 0.2s;
//                         }
//                         .timeline-content:hover {
//                             transform: translateY(-2px);
//                         }
//                         .timeline-content h4 {
//                             margin: 0 0 8px;
//                             font-size: 16px;
//                             color: #333;
//                         }
//                         .timeline-content p {
//                             margin: 0;
//                             color: #666;
//                             font-size: 14px;
//                         }
//                         .status-error { color: #d9534f; }
//                         .status-success { color: #5cb85c; }
//                         .status-danger { color: #f0ad4e; }
//                         .remarks-yellow {
//                             background-color: #fff3cd;
//                             display: inline-block;
//                             padding: 4px 8px;
//                             border-radius: 3px;
//                             margin-top: 8px;
//                         }
//                         .latest-activity .timeline-content {
//                             border-left: 4px solid #5cb85c;
//                         }
//                         .progress-bar-container {
//                             margin-bottom: 20px;
//                         }
//                         .progress-bar {
//                             height: 20px;
//                             background: #e9ecef;
//                             border-radius: 10px;
//                             overflow: hidden;
//                         }
//                         .progress-bar-fill {
//                             height: 100%;
//                             background: #5cb85c;
//                             transition: width 0.3s ease;
//                         }
//                     </style>
//                 `);
//                 dialog.show();
//             });
//         }
//     }
// });

// // Function to generate timeline HTML with progress bar
// function generate_activity_timeline(frm) {
//     // Sort activities in descending order based on update_on
//     let sorted_activities = frm.doc.rto_activity.slice().sort((a, b) => {
//         return new Date(b.update_on) - new Date(a.update_on);
//     });

//     // Show progress bar only if frm.doc.status is "Completed"
//     let progressBarHtml = frm.doc.status === 'Completed' ? `
//         <div class="progress-bar-container">
//             <h4>Completed: 100%</h4>
//             <div class="progress-bar">
//                 <div class="progress-bar-fill" style="width: 100%"></div>
//             </div>
//         </div>
//     ` : '';

//     let html = `
//         ${progressBarHtml}
//         <ul class="timeline">
//     `;

//     sorted_activities.forEach((row, index) => {
//         // Determine status class based on status value
//         let status_class = 'status-danger';
//         if (row.status === 'Application Verification Skipped') {
//             status_class = 'status-error';
//         } else if (['Application Verified', 'Payment Recorded', 'Registration Updated', 'Application Details Updated', 'Journals and Smart Cards Updated'].includes(row.status)) {
//             status_class = 'status-success';
//         }

//         // Format update_on date
//         let update_on = frappe.datetime.str_to_user(row.update_on);

//         // Handle remarks
//         let remarks = row.remarks ? `<span class="remarks-yellow">${frappe.utils.escape_html(row.remarks)}</span>` : '';

//         // Apply latest-activity class to the first row
//         let row_class = index === 0 ? 'latest-activity' : '';

//         html += `
//             <li class="timeline-item ${status_class} ${row_class}">
//                 <div class="timeline-icon"></div>
//                 <div class="timeline-content">
//                     <h4>${frappe.utils.escape_html(row.activity)}</h4>
//                     <p><strong>Status:</strong> <span class="${status_class}">${frappe.utils.escape_html(row.status)}</span></p>
//                     <p><strong>Updated By:</strong> ${frappe.utils.escape_html(row.user)}</p>
//                     <p><strong>Updated On:</strong> ${update_on}</p>
//                     ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
//                 </div>
//             </li>
//         `;
//     });

//     html += '</ul>';
//     return html;
// }

// frappe.ui.form.on('RTO Registration', {
//     refresh: function(frm) {
//         // Add custom button for Add Remarks
//         frm.add_custom_button(__('Add Remarks'), function() {
//             trigger_add_remarks_action(frm);
//         });

//         // Override form status indicator to show custom status
//         frm.set_intro(__('Status: ') + frm.doc.status, 'blue');
//     }
// });

// // Handle Add Remarks action
// function trigger_add_remarks_action(frm) {
//     let dialog = new frappe.ui.Dialog({
//         title: __('Update Remarks'),
//         fields: [
//             {
//                 label: 'Remarks',
//                 fieldname: 'remarks',
//                 fieldtype: 'Small Text',
//                 reqd: 1,
//                 default: frm.doc.remarks || ''
//             }
//         ],
//         primary_action_label: __('Save'),
//         primary_action(values) {
//             dialog.hide();

//             // Update remarks and status
//             frappe.call({
//                 method: 'frappe.client.set_value',
//                 args: {
//                     doctype: 'RTO Registration',
//                     name: frm.doc.name,
//                     fieldname: {
//                         remarks: values.remarks,
//                         status: 'Remarks Updated'
//                     }
//                 },
//                 callback: function(r) {
//                     if (!r.exc) {
//                         frm.reload_doc();
//                         frappe.msgprint({
//                             title: __('Success'),
//                             message: __('Remarks updated and status set to Remarks Updated.'),
//                             indicator: 'green'
//                         });
//                     } else {
//                         frappe.msgprint({
//                             title: __('Error'),
//                             message: __('Error updating remarks: ') + (r.exc || JSON.stringify(r)),
//                             indicator: 'red'
//                         });
//                         console.error('Update Remarks Error:', r.exc);
//                     }
//                 },
//                 error: function(err) {
//                     frappe.msgprint({
//                         title: __('Error'),
//                         message: __('Error updating remarks: ') + (err.message || JSON.stringify(err)),
//                         indicator: 'red'
//                     });
//                     console.error('Update Remarks Error:', err);
//                 }
//             });
//         },
//         secondary_action_label: __('Cancel'),
//         secondary_action: () => {
//             dialog.hide();
//             frappe.msgprint({
//                 title: __('Action Cancelled'),
//                 message: __('Remarks update cancelled.'),
//                 indicator: 'red'
//             });
//         }
//     });

//     dialog.show();
// }


frappe.ui.form.on('RTO Registration', {
    refresh: function(frm) {

        restrict_custom_buttons_by_role(frm);
        // Clear workflow_state if present
        if (frm.doc.workflow_state) {
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'RTO Registration',
                    name: frm.doc.name,
                    fieldname: {
                        workflow_state: ''
                    }
                },
                callback: function(r) {
                    if (!r.exc) {
                        frm.reload_doc();
                    } else {
                        log_rto_activity(frm, 'Clear Workflow State', 'Workflow State Clear Failed', r.exc || JSON.stringify(r));
                    }
                }
            });
        }

        // Add Update Application Details button
        if (frm.doc.status === 'Due Application Entry' || frm.doc.status === 'Required Update') {
            frm.add_custom_button(__('Update Application Details'), function() {
                show_update_registration_dialog(frm);
            });
        }

        // Add Verify Application Entry button
        if (frm.doc.status === 'Due Verification of Application') {
            frm.add_custom_button(__('Verify Application Entry'), function() {
                // Prompt for journal submission confirmation
                frappe.confirm(
                    __('Do you want to submit the linked journals? This action cannot be undone.'),
                    function() {
                        // User confirmed: Submit journals and update status
                        verify_and_submit_journals(frm);
                    },
                    function() {
                        // User declined: Prompt for remarks
                        prompt_for_remarks_no_verify(frm);
                    }
                );
            });
        }

        // Add Make Payment to RTO button
        if (frm.doc.status === 'Due Payment to RTO' && frm.doc.payment_status === 'Due') {
            frm.add_custom_button(__('Make Payment to RTO'), function() {
                _rto_payment_entry_action(frm);
            });
        }
        // Function to handle RTO payment entry redirection
function _rto_payment_entry_action(frm) {
    try {
        // Validate RTO Office
        if (!frm.doc.rto_office) {
            log_rto_activity(frm, 'Payment to RTO Attempted', 'Payment Failed', 'RTO Office is mandatory.');
            frappe.msgprint({
                title: __('Validation Error'),
                message: __('RTO Office is mandatory to proceed with payment entry.'),
                indicator: 'red'
            });
            return;
        }

        // Validate Registration Charge
        if (!frm.doc.registration_charge || frm.doc.registration_charge <= 0) {
            log_rto_activity(frm, 'Payment to RTO Attempted', 'Payment Failed', 'Registration Charge must be greater than zero.');
            frappe.msgprint({
                title: __('Validation Error'),
                message: __('Registration Charge must be greater than zero.'),
                indicator: 'red'
            });
            return;
        }

        // Get company abbreviation
        frappe.call({
            method: 'autowings_app.custom_scripts.utils.get_company_abbr',
            callback: function(r) {
                if (!r.exc && r.message) {
                    let company_abbr = r.message;
                    let paid_to_account = `${frm.doc.rto_office} Payable - ${company_abbr}`;

                    // Validate that the paid_to account exists
                    frappe.call({
                        method: 'frappe.client.get_value',
                        args: {
                            doctype: 'Account',
                            fieldname: 'name',
                            filters: { name: paid_to_account }
                        },
                        callback: function(r) {
                            if (!r.exc && !r.message.name) {
                                log_rto_activity(frm, 'Payment to RTO Attempted', 'Payment Failed', `Account ${paid_to_account} does not exist.`);
                                frappe.msgprint({
                                    title: __('Validation Error'),
                                    message: __('Account ') + paid_to_account + __(' does not exist. Please create the account first.'),
                                    indicator: 'red'
                                });
                                return;
                            }

                            // Construct Payment Entry URL with pre-filled values
                            let payment_entry_url = `/app/payment-entry/new-payment-entry?` +
                                `payment_type=Pay&` +
                                `party_type=Supplier&` +
                                `party=${encodeURIComponent(frm.doc.rto_office)}&` +
                                `party_name=${encodeURIComponent(frm.doc.rto_office)}&` +
                                `paid_to=${encodeURIComponent(paid_to_account)}&` +
                                `paid_amount=${frm.doc.registration_charge}&` +
                                `reference_doctype=RTO Registration&` +
                                `reference_name=${frm.doc.name}`;

                            // Log activity for payment initiation
                            log_rto_activity(frm, 'Payment to RTO Initiated', 'Payment Entry Started', '');
                            frappe.msgprint({
                                title: __('Success'),
                                message: __('Redirecting to Payment Entry form.'),
                                indicator: 'green'
                            });

                            // Redirect to Payment Entry form
                            window.location.href = payment_entry_url;
                        },
                        error: function(err) {
                            log_rto_activity(frm, 'Payment to RTO Attempted', 'Payment Failed', err.message || JSON.stringify(err));
                            frappe.msgprint({
                                title: __('Error'),
                                message: __('Error validating account: ') + (err.message || JSON.stringify(err)),
                                indicator: 'red'
                            });
                        }
                    });
                } else {
                    log_rto_activity(frm, 'Payment to RTO Attempted', 'Payment Failed', 'Failed to retrieve company abbreviation.');
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Error retrieving company abbreviation: ') + (r.exc || JSON.stringify(r)),
                        indicator: 'red'
                    });
                }
            },
            error: function(err) {
                log_rto_activity(frm, 'Payment to RTO Attempted', 'Payment Failed', 'Failed to retrieve company abbreviation.');
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error retrieving company abbreviation: ') + (err.message || JSON.stringify(err)),
                    indicator: 'red'
                });
            }
        });
    } catch (err) {
        log_rto_activity(frm, 'Payment to RTO Attempted', 'Payment Failed', err.message || JSON.stringify(err));
        frappe.msgprint({
            title: __('Error'),
            message: __('Unexpected error: ') + (err.message || JSON.stringify(err)),
            indicator: 'red'
        });
    }
}


        // Add Update Registration Number button
        if (frm.doc.status === 'Due Registration Number Entry') {
            frm.add_custom_button(__('Update Registration Number'), function() {
                let dialog = new frappe.ui.Dialog({
                    title: __('Update Registration Number'),
                    fields: [
                        {
                            label: __('Registration Number'),
                            fieldname: 'registration_number',
                            fieldtype: 'Data',
                            reqd: 1
                        }
                    ],
                    primary_action_label: __('Update'),
                    primary_action: function(values) {
                        if (!values.registration_number) {
                            frappe.throw(__('Registration Number is mandatory.'));
                        }
                        // Update RTO Registration and Vehicle Smart Card statuses
                        frappe.call({
                            method: 'frappe.client.set_value',
                            args: {
                                doctype: 'RTO Registration',
                                name: frm.doc.name,
                                fieldname: {
                                    registration_number: values.registration_number,
                                    status: 'Due Number Plate Ordering'
                                }
                            },
                            callback: function(r) {
                                if (!r.exc) {
                                    // Update Vehicle Smart Card statuses
                                    let promises = [];
                                    if (frm.doc.additional_accounts) {
                                        frm.doc.additional_accounts.forEach(acc => {
                                            if (acc.smart_card_id) {
                                                promises.push(
                                                    frappe.db.get_doc('Vehicle Smart Card', acc.smart_card_id)
                                                        .then(smart_card => {
                                                            // Set status based on Vehicle Smart Card's payment_status
                                                            smart_card.status = smart_card.smart_card_payment_status === 'Paid' ? 'Due Updation in Vahan' : 'Due Payment to RTO';
                                                            smart_card.journal_account = acc.account; // Set journal_account from additional_accounts
                                                            smart_card.smart_card_status = "Applied";
                                                            smart_card.registration_number = values.registration_number;
                                                            return frappe.call({
                                                                method: 'frappe.client.save',
                                                                args: { doc: smart_card }
                                                            });
                                                        })
                                                        .catch(err => {
                                                            throw new Error(`Error updating Vehicle Smart Card ${acc.smart_card_id}: ${err.message}`);
                                                        })
                                                );
                                            }
                                        });
                                    }
                                    Promise.all(promises)
                                        .then(() => {
                                            // Log activity
                                            log_rto_activity(frm, 'Registration Number Updated', 'Registration Updated', '');
                                            frm.reload_doc();
                                            frappe.msgprint({
                                                title: __('Success'),
                                                message: __('Registration Number updated.'),
                                                indicator: 'green'
                                            });
                                            dialog.hide();
                                        })
                                        .catch(err => {
                                            log_rto_activity(frm, 'Registration Number Updated', 'Registration Update Failed', err.message || 'Error updating Vehicle Smart Cards');
                                            frappe.msgprint({
                                                title: __('Error'),
                                                message: err.message || __('Error updating Vehicle Smart Cards.'),
                                                indicator: 'red'
                                            });
                                        });
                                } else {
                                    log_rto_activity(frm, 'Registration Number Updated', 'Registration Update Failed', r.exc || JSON.stringify(r));
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: __('Error updating Registration Number: ') + (r.exc || JSON.stringify(r)),
                                        indicator: 'red'
                                    });
                                }
                            }
                        });
                    },
                    secondary_action_label: __('Cancel'),
                    secondary_action: function() {
                        dialog.hide();
                    }
                });
                dialog.show();
            });
        }

        // Override form status indicator to show custom status
        frm.set_intro(__('Status: ') + frm.doc.status, 'blue');
    }
});

// Log activity to RTO Activity Log child table
function log_rto_activity(frm, activity, status, remarks) {
    let activity_log = {
        doctype: 'RTO Activity Log',
        activity: activity,
        status: status,
        user: frappe.session.user,
        update_on: frappe.datetime.now_datetime(),
        remarks: remarks || '',
        parent: frm.doc.name,
        parentfield: 'rto_activity',
        parenttype: 'RTO Registration'
    };

    // Append to rto_activity child table
    frappe.call({
        method: 'frappe.client.insert',
        args: {
            doc: activity_log
        },
        callback: function(r) {
            if (r.exc) {
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error logging activity: ') + (r.exc || JSON.stringify(r)),
                    indicator: 'red'
                });
                console.error('Activity Log Error:', r.exc);
            }
        }
    });
}

// Verify application and submit journals
function verify_and_submit_journals(frm) {
    let promises = [];

    // Submit main journal if exists
    if (frm.doc.journal_entry_id) {
        promises.push(
            frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
                .then(journal => {
                    if (journal.docstatus !== 0) {
                        throw new Error(`Main Journal Entry ${frm.doc.journal_entry_id} is not in Draft status.`);
                    }
                    console.log('Submitting main journal:', frm.doc.journal_entry_id);
                    return frappe.call({
                        method: 'frappe.client.submit',
                        args: { doc: journal }
                    });
                })
                .catch(err => {
                    throw new Error(`Error submitting main journal: ${err.message}`);
                })
        );
    }

    // Submit child journals
    let journal_updates = frm.doc.additional_accounts ? frm.doc.additional_accounts.filter(acc => acc.journal_entry_id) : [];
    journal_updates.forEach(acc => {
        promises.push(
            frappe.db.get_doc('Journal Entry', acc.journal_entry_id)
                .then(journal => {
                    if (journal.docstatus !== 0) {
                        throw new Error(`Journal ${acc.journal_entry_id} is not in Draft status.`);
                    }
                    console.log('Submitting child journal:', acc.journal_entry_id);
                    return frappe.call({
                        method: 'frappe.client.submit',
                        args: { doc: journal }
                    });
                })
                .catch(err => {
                    throw new Error(`Error submitting child journal ${acc.journal_entry_id}: ${err.message}`);
                })
        );
    });

    // Update RTO Registration after submitting journals
    Promise.all(promises)
        .then(() => {
            // Prepare updated additional_accounts with status Submitted
            let updated_additional_accounts = frm.doc.additional_accounts ? frm.doc.additional_accounts.map(acc => ({
                name: acc.name,
                account: acc.account,
                amount: acc.amount,
                journal_entry_id: acc.journal_entry_id,
                smart_card_id: acc.smart_card_id,
                status: acc.journal_entry_id ? 'Submitted' : acc.status,
                idx: acc.idx,
                parent: frm.doc.name,
                parentfield: 'additional_accounts',
                parenttype: 'RTO Registration',
                doctype: 'RTO Additional AC'
            })) : [];

            // Determine new status based on payment_status
            let new_status = frm.doc.payment_status === 'Due' ? 'Due Payment to RTO' : 'Due Registration Number Entry';

            // Update RTO Registration
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'RTO Registration',
                    name: frm.doc.name,
                    fieldname: {
                        status: new_status,
                        journal_status: frm.doc.journal_entry_id ? 'Submitted' : frm.doc.journal_status,
                        additional_accounts: updated_additional_accounts,
                        workflow_state: ''
                    }
                },
                callback: function(r) {
                    if (!r.exc) {
                        // Log activity
                        log_rto_activity(frm, 'Verified Application with Journal Submission', 'Application Verified', '');
                        frm.reload_doc();
                        frappe.msgprint({
                            title: __('Success'),
                            message: __('Application Entry verified and journals submitted.'),
                            indicator: 'green'
                        });
                    } else {
                        log_rto_activity(frm, 'Verified Application with Journal Submission', 'Application Verification Failed', r.exc || JSON.stringify(r));
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Error updating RTO Registration: ') + (r.exc || JSON.stringify(r)),
                            indicator: 'red'
                        });
                    }
                }
            });
        })
        .catch(err => {
            log_rto_activity(frm, 'Verified Application with Journal Submission', 'Application Verification Failed', err.message || 'Error submitting journals');
            frappe.msgprint({
                title: __('Error'),
                message: err.message || __('Error submitting journals.'),
                indicator: 'red'
            });
            console.error('Journal Submission Error:', err);
        });
}

// Prompt for remarks if journals are not submitted
function prompt_for_remarks_no_verify(frm) {
    let remark_dialog = new frappe.ui.Dialog({
        title: __('Enter Remarks'),
        fields: [
            {
                label: __('Remarks'),
                fieldname: 'remarks',
                fieldtype: 'Small Text',
                reqd: 1,
                description: __('Please provide the reason for not submitting the journals.')
            }
        ],
        primary_action_label: __('Save'),
        primary_action: function(values) {
            // Update RTO Registration with status only
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'RTO Registration',
                    name: frm.doc.name,
                    fieldname: {
                        status: 'Due Application Entry',
                        workflow_state: ''
                    }
                },
                callback: function(r) {
                    if (!r.exc) {
                        // Log activity
                        log_rto_activity(frm, 'Verified Application without Journal Submission', 'Application Verification Skipped', values.remarks);
                        frm.reload_doc();
                        frappe.msgprint({
                            title: __('Success'),
                            message: __('Application Entry verification skipped, status set to Required Update.'),
                            indicator: 'green'
                        });
                        remark_dialog.hide();
                    } else {
                        log_rto_activity(frm, 'Verified Application without Journal Submission', 'Application Verification Skipped Failed', r.exc || JSON.stringify(r));
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Error updating status: ') + (r.exc || JSON.stringify(r)),
                            indicator: 'red'
                        });
                    }
                }
            });
        },
        secondary_action_label: __('Cancel'),
        secondary_action: function() {
            remark_dialog.hide();
        }
    });
    remark_dialog.show();
}

// Show dialog for updating registration details
function show_update_registration_dialog(frm) {
    // Prepare fields for the dialog
    let fields = [
        {
            label: __('Final Registration Charge'),
            fieldname: 'final_registration_charge',
            fieldtype: 'Currency',
            default: frm.doc.registration_charge || 0,
            reqd: 1
        },
        {
            label: __('Application Entry Date'),
            fieldname: 'application_entry_date',
            fieldtype: 'Date',
            default: frm.doc.application_entry_date || frappe.datetime.now_date(),
            reqd: 1
        },
        {
            label: __('Application Number'),
            fieldname: 'application_number',
            fieldtype: 'Data',
            default: frm.doc.application_number || '',
            reqd: 1
        },
        {
            label: __('Additional Accounts'),
            fieldname: 'additional_accounts',
            fieldtype: 'Table',
            cannot_add_rows: false,
            in_place_edit: true,
            reqd: 0,
            data: frm.doc.additional_accounts ? frm.doc.additional_accounts.map(acc => ({
                name: acc.name,
                account: acc.account,
                amount: acc.amount,
                journal_entry_id: acc.journal_entry_id,
                smart_card_id: acc.smart_card_id
            })) : [],
            fields: [
                {
                    label: __('Account'),
                    fieldname: 'account',
                    fieldtype: 'Link',
                    options: 'Account',
                    in_list_view: 1,
                    reqd: 1,
                    read_only: 1
                },
                {
                    label: __('Amount'),
                    fieldname: 'amount',
                    fieldtype: 'Currency',
                    in_list_view: 1,
                    reqd: 1
                },
                {
                    fieldname: 'journal_entry_id',
                    fieldtype: 'Link',
                    options: 'Journal Entry',
                    hidden: 1
                },
                {
                    fieldname: 'smart_card_id',
                    fieldtype: 'Link',
                    options: 'Vehicle Smart Card',
                    hidden: 1
                }
            ]
        }
    ];

    let dialog = new frappe.ui.Dialog({
        title: __('Update Registration and Application Details'),
        fields: fields,
        primary_action_label: __('Update'),
        primary_action: function(values) {
            // Validate inputs
            if (values.final_registration_charge <= 0) {
                frappe.throw(__('Final Registration Charge must be greater than zero.'));
            }
            if (!values.application_entry_date) {
                frappe.throw(__('Application Entry Date is mandatory.'));
            }
            if (!values.application_number) {
                frappe.throw(__('Application Number is mandatory.'));
            }

            // Check if any fields have changed
            let has_changes = (
                values.final_registration_charge !== (frm.doc.registration_charge || 0) ||
                values.application_entry_date !== (frm.doc.application_entry_date || '') ||
                values.application_number !== (frm.doc.application_number || '') ||
                JSON.stringify(values.additional_accounts) !== JSON.stringify(
                    frm.doc.additional_accounts ? frm.doc.additional_accounts.map(acc => ({
                        name: acc.name,
                        account: acc.account,
                        amount: acc.amount,
                        journal_entry_id: acc.journal_entry_id,
                        smart_card_id: acc.smart_card_id
                    })) : []
                )
            );

            // Update RTO Registration, journals, and smart cards
            update_rto_and_journals(frm, values, dialog, has_changes);
        },
        secondary_action_label: __('Cancel'),
        secondary_action: function() {
            dialog.hide();
            frappe.msgprint({
                title: __('Action Cancelled'),
                message: __('Update cancelled.'),
                indicator: 'red'
            });
        }
    });
    dialog.show();
}

// Update RTO Registration, journals, and smart cards
function update_rto_and_journals(frm, values, dialog, has_changes) {
    // Prepare updated additional_accounts by merging with existing data
    let updated_additional_accounts = values.additional_accounts.map(new_acc => {
        let existing_acc = frm.doc.additional_accounts ? frm.doc.additional_accounts.find(acc => acc.name === new_acc.name) : null;
        return {
            name: new_acc.name,
            account: new_acc.account,
            amount: new_acc.amount,
            journal_entry_id: new_acc.journal_entry_id || (existing_acc ? existing_acc.journal_entry_id : null),
            smart_card_id: new_acc.smart_card_id || (existing_acc ? existing_acc.smart_card_id : null),
            status: (existing_acc && existing_acc.status) || 'Draft',
            idx: existing_acc ? existing_acc.idx : 0,
            parent: frm.doc.name,
            parentfield: 'additional_accounts',
            parenttype: 'RTO Registration',
            doctype: 'RTO Additional AC'
        };
    });

    // Update RTO Registration document
    frappe.call({
        method: 'frappe.client.set_value',
        args: {
            doctype: 'RTO Registration',
            name: frm.doc.name,
            fieldname: {
                registration_charge: values.final_registration_charge,
                application_entry_date: values.application_entry_date,
                application_number: values.application_number,
                registration_status: 'Applied',
                status: 'Due Verification of Application',
                workflow_state: '',
                additional_accounts: updated_additional_accounts
            }
        },
        callback: function(r) {
            if (!r.exc) {
                // Log activity
                if (has_changes) {
                    log_rto_activity(frm, 'Updated Application Details', 'Application Details Updated', '');
                }
                // Update main journal, child journals, and smart cards
                update_journals_and_smart_cards(frm, values.final_registration_charge, updated_additional_accounts, dialog, has_changes);
            } else {
                log_rto_activity(frm, 'Updated Application Details', 'Application Details Update Failed', r.exc || JSON.stringify(r));
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error updating RTO Registration: ') + (r.exc || JSON.stringify(r)),
                    indicator: 'red'
                });
                console.error('Update RTO Error:', r.exc);
                dialog.hide();
            }
        },
        error: function(err) {
            log_rto_activity(frm, 'Updated Application Details', 'Application Details Update Failed', err.message || JSON.stringify(err));
            frappe.msgprint({
                title: __('Error'),
                message: __('Error updating RTO Registration: ') + (err.message || JSON.stringify(err)),
                indicator: 'red'
            });
            console.error('Update RTO Error:', err);
            dialog.hide();
        }
    });
}

// Update main journal, child journals, and smart cards
function update_journals_and_smart_cards(frm, new_charge, additional_accounts, dialog, has_changes) {
    // Get company abbreviation
    frappe.call({
        method: 'autowings_app.custom_scripts.utils.get_company_abbr',
        callback: function(r) {
            if (!r.exc && r.message) {
                let company_abbr = r.message;
                // Prepare accounts for validation (use account_name, not name)
                let accounts_to_validate = [
                    'Debtors',
                    frm.doc.rto_office
                ].concat(additional_accounts.map(acc => acc.account));

                // Validate accounts using server-side function
                frappe.call({
                    method: 'autowings_app.custom_scripts.utils.validate_accounts',
                    args: {
                        accounts: accounts_to_validate,
                        company: frm.doc.company || 'Autowings'
                    },
                    callback: function(r) {
                        if (!r.exc && r.message) {
                            let promises = [];

                            // Update main journal if exists
                            if (frm.doc.journal_entry_id) {
                                promises.push(
                                    frappe.db.get_doc('Journal Entry', frm.doc.journal_entry_id)
                                        .then(main_journal => {
                                            if (main_journal.docstatus !== 0) {
                                                throw new Error('Main Journal Entry is not in Draft status.');
                                            }
                                            console.log('Updating main journal:', frm.doc.journal_entry_id, 'with amount:', new_charge);
                                            update_main_journal_entry(frm, main_journal, new_charge, company_abbr);
                                            return frappe.call({
                                                method: 'frappe.client.save',
                                                args: { doc: main_journal }
                                            });
                                        })
                                        .catch(err => {
                                            throw new Error(`Error updating main journal: ${err.message}`);
                                        })
                                );
                            }

                            // Update child journals and smart cards
                            let journal_updates = additional_accounts.filter(acc => acc.journal_entry_id && acc.amount >= 0);
                            journal_updates.forEach(acc => {
                                // Update child journal
                                promises.push(
                                    frappe.db.get_doc('Journal Entry', acc.journal_entry_id)
                                        .then(journal => {
                                            if (journal.docstatus !== 0) {
                                                throw new Error(`Journal ${acc.journal_entry_id} is not in Draft status.`);
                                            }
                                            console.log('Updating child journal:', acc.journal_entry_id, 'with amount:', acc.amount);
                                            update_child_journal_entry(frm, journal, acc, company_abbr);
                                            return frappe.call({
                                                method: 'frappe.client.save',
                                                args: { doc: journal }
                                            });
                                        })
                                        .catch(err => {
                                            throw new Error(`Error updating child journal ${acc.journal_entry_id}: ${err.message}`);
                                        })
                                );

                                // Update Vehicle Smart Card if smart_card_id exists
                                if (acc.smart_card_id) {
                                    promises.push(
                                        frappe.db.get_doc('Vehicle Smart Card', acc.smart_card_id)
                                            .then(smart_card => {
                                                if (smart_card.docstatus !== 0) {
                                                    throw new Error(`Vehicle Smart Card ${acc.smart_card_id} is not in Draft status.`);
                                                }
                                                if (smart_card.rto_registration_id !== frm.doc.name) {
                                                    console.warn(`Smart Card ${acc.smart_card_id} linked to different RTO Registration: ${smart_card.rto_registration_id}`);
                                                }
                                                console.log('Updating smart card:', acc.smart_card_id, 'with charge:', acc.amount, 'and journal:', acc.journal_entry_id);
                                                smart_card.smart_card_charge = acc.amount;
                                                smart_card.journal_entry_id = acc.journal_entry_id;
                                                smart_card.rto_registration_id = frm.doc.name;
                                                return frappe.call({
                                                    method: 'frappe.client.save',
                                                    args: { doc: smart_card }
                                                });
                                            })
                                            .catch(err => {
                                                throw new Error(`Error updating Vehicle Smart Card ${acc.smart_card_id}: ${err.message}`);
                                            })
                                    );
                                }
                            });

                            Promise.all(promises)
                                .then(() => {
                                    // Log activity only if changes were made
                                    if (has_changes) {
                                        log_rto_activity(frm, 'Updated Application Details', 'Journals and Smart Cards Updated', '');
                                    }
                                    finalize_update(frm, dialog, has_changes);
                                })
                                .catch(err => {
                                    log_rto_activity(frm, 'Updated Application Details', 'Journals and Smart Cards Update Failed', err.message || 'Error updating journals or smart cards');
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: err.message || __('Error updating journals or smart cards.'),
                                        indicator: 'red'
                                    });
                                    console.error('Update Journals/Smart Cards Error:', err);
                                    dialog.hide();
                                });
                        } else {
                            log_rto_activity(frm, 'Updated Application Details', 'Account Validation Failed', r.exc || JSON.stringify(r));
                            frappe.msgprint({
                                title: __('Validation Error'),
                                message: __('One or more accounts are invalid: ') + (r.exc || JSON.stringify(r)),
                                indicator: 'red'
                            });
                            console.error('Validate Accounts Error:', r.exc);
                            dialog.hide();
                        }
                    },
                    error: function(err) {
                        log_rto_activity(frm, 'Updated Application Details', 'Account Validation Failed', err.message || JSON.stringify(err));
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Error validating accounts: ') + (err.message || JSON.stringify(err)),
                            indicator: 'red'
                        });
                        console.error('Validate Accounts Error:', err);
                        dialog.hide();
                    }
                });
            } else {
                log_rto_activity(frm, 'Updated Application Details', 'Company Abbreviation Fetch Failed', r.exc || JSON.stringify(r));
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error fetching company abbreviation: ') + (r.exc || JSON.stringify(r)),
                    indicator: 'red'
                });
                console.error('Company Abbr Error:', r.exc);
                dialog.hide();
            }
        },
        error: function(err) {
            log_rto_activity(frm, 'Updated Application Details', 'Company Abbreviation Fetch Failed', err.message || JSON.stringify(err));
            frappe.msgprint({
                title: __('Error'),
                message: __('Error fetching company abbreviation: ') + (err.message || JSON.stringify(err)),
                indicator: 'red'
            });
            console.error('Company Abbr Error:', err);
            dialog.hide();
        }
    });
}

// Update main journal entry
function update_main_journal_entry(frm, journal, new_charge, company_abbr) {
    let debtorAccount = journal.accounts.find(acc => 
        acc.account === `Debtors - ${company_abbr}` && 
        acc.debit_in_account_currency > 0 &&
        acc.against_account.includes(frm.doc.rto_office)
    );
    let payableAccount = journal.accounts.find(acc => 
        acc.account === `${frm.doc.rto_office} Payable - ${company_abbr}` && 
        acc.credit_in_account_currency > 0
    );

    if (debtorAccount && payableAccount) {
        debtorAccount.debit_in_account_currency = new_charge;
        debtorAccount.debit = new_charge;
        payableAccount.credit_in_account_currency = new_charge;
        payableAccount.credit = new_charge;
    } else {
        journal.accounts = [
            {
                account: `Debtors - ${company_abbr}`,
                party_type: 'Customer',
                party: frm.doc.customer,
                debit_in_account_currency: new_charge,
                debit: new_charge,
                credit_in_account_currency: 0,
                credit: 0,
                cost_center: `Main - ${company_abbr}`,
                against_account: frm.doc.rto_office
            },
            {
                account: `${frm.doc.rto_office} Payable - ${company_abbr}`,
                party_type: 'Supplier',
                party: frm.doc.rto_office,
                debit_in_account_currency: 0,
                debit: 0,
                credit_in_account_currency: new_charge,
                credit: new_charge,
                cost_center: `Main - ${company_abbr}`,
                against_account: frm.doc.customer
            }
        ];
    }

    journal.total_debit = new_charge;
    journal.total_credit = new_charge;
    journal.total_amount = new_charge;
}

// Update child journal entry
function update_child_journal_entry(frm, journal, acc, company_abbr) {
    let debtorAccount = journal.accounts.find(a => a.account === `Debtors - ${company_abbr}` && a.debit_in_account_currency >= 0);
    let payableAccount = journal.accounts.find(a => a.account.includes(acc.account) && a.credit_in_account_currency >= 0);

    if (debtorAccount && payableAccount) {
        debtorAccount.debit_in_account_currency = acc.amount;
        debtorAccount.debit = acc.amount;
        payableAccount.credit_in_account_currency = acc.amount;
        payableAccount.credit = acc.amount;
    } else {
        journal.accounts = [
            {
                account: `Debtors - ${company_abbr}`,
                party_type: 'Customer',
                party: frm.doc.customer,
                debit_in_account_currency: acc.amount,
                debit: acc.amount,
                credit_in_account_currency: 0,
                credit: 0,
                cost_center: `Main - ${company_abbr}`,
                against_account: acc.account
            },
            {
                account: `${acc.account} Payable - ${company_abbr}`,
                party_type: 'Supplier',
                party: acc.account,
                debit_in_account_currency: 0,
                debit: 0,
                credit_in_account_currency: acc.amount,
                credit: acc.amount,
                cost_center: `Main - ${company_abbr}`,
                against_account: frm.doc.customer
            }
        ];
    }

    journal.total_debit = acc.amount;
    journal.total_credit = acc.amount;
    journal.total_amount = acc.amount;
}

// Finalize the update
function finalize_update(frm, dialog, has_changes) {
    frm.reload_doc();
    if (has_changes) {
        frappe.msgprint({
            title: __('Success'),
            message: __('Registration and application details updated successfully.'),
            indicator: 'green'
        });
    } else {
        frappe.msgprint({
            title: __('No Changes'),
            message: __('No changes were made to the registration or application details.'),
            indicator: 'orange'
        });
    }
    dialog.hide();
}


// other one


// frappe.ui.form.on('RTO Registration', {
//     refresh: function(frm) {
//         // Add Order Number Plate button
//         if (frm.doc.status === 'Due Number Plate Ordering' && !frm.doc.number_plate_ordered) {
//             frm.add_custom_button(__('Order Number Plate'), function() {
//                 let dialog = new frappe.ui.Dialog({
//                     title: __('Order Number Plate'),
//                     fields: [
//                         {
//                             label: __('Order Details'),
//                             fieldname: 'order_details',
//                             fieldtype: 'Small Text',
//                             reqd: 1
//                         }
//                     ],
//                     primary_action_label: __('Order'),
//                     primary_action: function(values) {
//                         if (!values.order_details) {
//                             frappe.throw(__('Order Details are mandatory.'));
//                         }
//                         frappe.call({
//                             method: 'frappe.client.set_value',
//                             args: {
//                                 doctype: 'RTO Registration',
//                                 name: frm.doc.name,
//                                 fieldname: {
//                                     number_plate_ordered: 1,
//                                     number_plate_order_details: values.order_details,
//                                     status: 'Number Plate Not Received'
//                                 }
//                             },
//                             callback: function(r) {
//                                 if (!r.exc) {
//                                     log_rto_activity(frm, 'Number Plate Ordered', 'Order Placed', values.order_details);
//                                     frm.reload_doc();
//                                     frappe.msgprint({
//                                         title: __('Success'),
//                                         message: __('Number Plate ordered successfully.'),
//                                         indicator: 'green'
//                                     });
//                                     dialog.hide();
//                                 } else {
//                                     log_rto_activity(frm, 'Number Plate Ordered', 'Order Failed', r.exc || JSON.stringify(r));
//                                     frappe.msgprint({
//                                         title: __('Error'),
//                                         message: __('Error ordering Number Plate: ') + (r.exc || JSON.stringify(r)),
//                                         indicator: 'red'
//                                     });
//                                 }
//                             }
//                         });
//                     },
//                     secondary_action_label: __('Cancel'),
//                     secondary_action: function() {
//                         dialog.hide();
//                         prompt_for_remarks(frm, 'Number Plate Order Cancelled', 'Order Cancelled');
//                     }
//                 });
//                 dialog.show();
//             });
//         }

//         // Add Number Plate Received button
//         if (frm.doc.status === 'Number Plate Not Received' && frm.doc.number_plate_ordered && !frm.doc.number_plate_received) {
//             frm.add_custom_button(__('Number Plate Received'), function() {
//                 let dialog = new frappe.ui.Dialog({
//                     title: __('Number Plate Received'),
//                     fields: [
//                         {
//                             label: __('Received Details'),
//                             fieldname: 'received_details',
//                             fieldtype: 'Small Text',
//                             reqd: 1
//                         }
//                     ],
//                     primary_action_label: __('Confirm Receipt'),
//                     primary_action: function(values) {
//                         if (!values.received_details) {
//                             frappe.throw(__('Received Details are mandatory.'));
//                         }
//                         frappe.call({
//                             method: 'frappe.client.set_value',
//                             args: {
//                                 doctype: 'RTO Registration',
//                                 name: frm.doc.name,
//                                 fieldname: {
//                                     number_plate_received: 1,
//                                     number_plate_received_details: values.received_details,
//                                     status: 'Due Number Plate Installation'
//                                 }
//                             },
//                             callback: function(r) {
//                                 if (!r.exc) {
//                                     log_rto_activity(frm, 'Number Plate Received', 'Receipt Confirmed', values.received_details);
//                                     frm.reload_doc();
//                                     frappe.msgprint({
//                                         title: __('Success'),
//                                         message: __('Number Plate receipt confirmed successfully.'),
//                                         indicator: 'green'
//                                     });
//                                     dialog.hide();
//                                 } else {
//                                     log_rto_activity(frm, 'Number Plate Received', 'Receipt Failed', r.exc || JSON.stringify(r));
//                                     frappe.msgprint({
//                                         title: __('Error'),
//                                         message: __('Error confirming Number Plate receipt: ') + (r.exc || JSON.stringify(r)),
//                                         indicator: 'red'
//                                     });
//                                 }
//                             }
//                         });
//                     },
//                     secondary_action_label: __('Cancel'),
//                     secondary_action: function() {
//                         dialog.hide();
//                         prompt_for_remarks(frm, 'Number Plate Receipt Cancelled', 'Receipt Cancelled');
//                     }
//                 });
//                 dialog.show();
//             });
//         }

//         // Add Number Plate Installation button
//         if (frm.doc.status === 'Due Number Plate Installation' && frm.doc.number_plate_received && !frm.doc.number_plate_installed) {
//             frm.add_custom_button(__('Number Plate Installation'), function() {
//                 let dialog = new frappe.ui.Dialog({
//                     title: __('Number Plate Installation'),
//                     fields: [
//                         {
//                             label: __('Installation Details'),
//                             fieldname: 'installation_details',
//                             fieldtype: 'Small Text',
//                             reqd: 1
//                         },
//                         {
//                             label: __('Installed By'),
//                             fieldname: 'installed_by',
//                             fieldtype: 'Link',
//                             options: 'User',
//                             reqd: 1
//                         },
//                         {
//                             label: __('Installation Date'),
//                             fieldname: 'installation_date',
//                             fieldtype: 'Datetime',
//                             reqd: 1,
//                             default: frappe.datetime.now_datetime()
//                         }
//                     ],
//                     primary_action_label: __('Install'),
//                     primary_action: function(values) {
//                         if (!values.installation_details) {
//                             frappe.throw(__('Installation Details are mandatory.'));
//                         }
//                         if (!values.installed_by) {
//                             frappe.throw(__('Installed By is mandatory.'));
//                         }
//                         if (!values.installation_date) {
//                             frappe.throw(__('Installation Date is mandatory.'));
//                         }
//                         frappe.call({
//                             method: 'frappe.client.set_value',
//                             args: {
//                                 doctype: 'RTO Registration',
//                                 name: frm.doc.name,
//                                 fieldname: {
//                                     number_plate_installed: 1,
//                                     number_plate_installation_details: values.installation_details,
//                                     installed_by: values.installed_by,
//                                     installation_date: values.installation_date,
//                                     status: 'Due Scanning RC'
//                                 }
//                             },
//                             callback: function(r) {
//                                 if (!r.exc) {
//                                     log_rto_activity(frm, 'Number Plate Installed', 'Installation Completed', `Installed by ${values.installed_by} on ${values.installation_date}`);
//                                     frm.reload_doc();
//                                     frappe.msgprint({
//                                         title: __('Success'),
//                                         message: __('Number Plate installed successfully.'),
//                                         indicator: 'green'
//                                     });
//                                     dialog.hide();
//                                 } else {
//                                     log_rto_activity(frm, 'Number Plate Installed', 'Installation Failed', r.exc || JSON.stringify(r));
//                                     frappe.msgprint({
//                                         title: __('Error'),
//                                         message: __('Error confirming Number Plate installation: ') + (r.exc || JSON.stringify(r)),
//                                         indicator: 'red'
//                                     });
//                                 }
//                             }
//                         });
//                     },
//                     secondary_action_label: __('Cancel'),
//                     secondary_action: function() {
//                         dialog.hide();
//                         prompt_for_remarks(frm, 'Number Plate Installation Cancelled', 'Installation Cancelled');
//                     }
//                 });
//                 dialog.show();
//             });
//         }


//                 // Add Attach Scanned Document button
//                 if (frm.doc.status === 'Due Scanning RC' && frm.doc.number_plate_installed) {
//                     frm.add_custom_button(__('Attach Scanned Document'), function() {
//                         // Fetch the initial number of attachments
//                         frappe.call({
//                             method: 'frappe.client.get_list',
//                             args: {
//                                 doctype: 'File',
//                                 fields: ['file_name', 'file_url'],
//                                 filters: {
//                                     attached_to_doctype: 'RTO Registration',
//                                     attached_to_name: frm.doc.name
//                                 }
//                             },
//                             callback: function(r) {
//                                 if (!r.exc) {
//                                     let initial_attachments = r.message || [];
//                                     let initial_count = initial_attachments.length;
        
//                                     // Simulate click on the sidebar's "Add Attachment" button
//                                     let add_attachment_btn = $('.layout-side-section .add-attachment-btn');
//                                     if (add_attachment_btn.length > 0) {
//                                         add_attachment_btn.click();
        
//                                         // Monitor for an increase in attachment count
//                                         let checkAttachments = setInterval(function() {
//                                             frappe.call({
//                                                 method: 'frappe.client.get_list',
//                                                 args: {
//                                                     doctype: 'File',
//                                                     fields: ['file_name', 'file_url'],
//                                                     filters: {
//                                                         attached_to_doctype: 'RTO Registration',
//                                                         attached_to_name: frm.doc.name
//                                                     }
//                                                 },
//                                                 callback: function(r) {
//                                                     if (!r.exc) {
//                                                         let current_attachments = r.message || [];
//                                                         let current_count = current_attachments.length;
        
//                                                         // Check if the attachment count has increased
//                                                         if (current_count > initial_count) {
//                                                             // Stop checking once a new attachment is confirmed
//                                                             clearInterval(checkAttachments);
        
//                                                             // Update status to Completed
//                                                             frappe.call({
//                                                                 method: 'frappe.client.set_value',
//                                                                 args: {
//                                                                     doctype: 'RTO Registration',
//                                                                     name: frm.doc.name,
//                                                                     fieldname: {
//                                                                         status: 'Completed'
//                                                                     }
//                                                                 },
//                                                                 callback: function(r) {
//                                                                     if (!r.exc) {
//                                                                         log_rto_activity(frm, 'Scanned RC Attached', 'Process Completed', 'All scanned RC documents attached.');
//                                                                         frm.reload_doc();
//                                                                         frappe.msgprint({
//                                                                             title: __('Success'),
//                                                                             message: __('Scanned RC documents attached and process completed.'),
//                                                                             indicator: 'green'
//                                                                         });
//                                                                     } else {
//                                                                         log_rto_activity(frm, 'Scanned RC Attached', 'Completion Failed', r.exc || JSON.stringify(r));
//                                                                         frappe.msgprint({
//                                                                             title: __('Error'),
//                                                                             message: __('Error completing the process: ') + (r.exc || JSON.stringify(r)),
//                                                                             indicator: 'red'
//                                                                         });
//                                                                     }
//                                                                 }
//                                                             });
//                                                         }
//                                                     }
//                                                 }
//                                             });
//                                         }, 1000); // Check every second
//                                     } else {
//                                         frappe.msgprint({
//                                             title: __('Error'),
//                                             message: __('Add Attachment button not found in the sidebar.'),
//                                             indicator: 'red'
//                                         });
//                                     }
//                                 }
//                             }
//                         });
//                     });
//                 }
//             }
//         });

// // Reusable function to log activity in rto_activity child table
// function log_rto_activity(frm, activity, status, remarks) {
//     let activity_log = {
//         doctype: 'RTO Activity Log',
//         activity: activity,
//         status: status,
//         user: frappe.session.user,
//         update_on: frappe.datetime.now_datetime(),
//         remarks: remarks || '',
//         parent: frm.doc.name,
//         parentfield: 'rto_activity',
//         parenttype: 'RTO Registration'
//     };

//     frappe.call({
//         method: 'frappe.client.insert',
//         args: {
//             doc: activity_log
//         },
//         callback: function(r) {
//             if (r.exc) {
//                 frappe.msgprint({
//                     title: __('Error'),
//                     message: __('Error logging activity: ') + (r.exc || JSON.stringify(r)),
//                     indicator: 'red'
//                 });
//                 console.error('Activity Log Error:', r.exc);
//             }
//         }
//     });
// }

// // Reusable function to prompt for remarks on cancellation
// function prompt_for_remarks(frm, activity, status) {
//     let remark_dialog = new frappe.ui.Dialog({
//         title: __('Enter Remarks'),
//         fields: [
//             {
//                 label: __('Remarks'),
//                 fieldname: 'remarks',
//                 fieldtype: 'Small Text',
//                 reqd: 1,
//                 description: __('Please provide the reason for cancellation.')
//             }
//         ],
//         primary_action_label: __('Save'),
//         primary_action: function(values) {
//             log_rto_activity(frm, activity, status, values.remarks);
//             frm.reload_doc();
//             frappe.msgprint({
//                 title: __('Success'),
//                 message: __('Remarks added successfully.'),
//                 indicator: 'green'
//             });
//             remark_dialog.hide();
//         },
//         secondary_action_label: __('Cancel'),
//         secondary_action: function() {
//             remark_dialog.hide();
//         }
//     });
//     remark_dialog.show();
// }

frappe.ui.form.on('RTO Registration', {
    refresh: function(frm) {
        // Add Order Number Plate button
        if (frm.doc.status === 'Due Number Plate Ordering' && !frm.doc.number_plate_ordered) {
            frm.add_custom_button(__('Order Number Plate'), function() {
                let dialog = new frappe.ui.Dialog({
                    title: __('Order Number Plate'),
                    fields: [
                        {
                            label: __('Order Date'),
                            fieldname: 'order_date',
                            fieldtype: 'Datetime',
                            reqd: 1,
                            default: frappe.datetime.now_datetime()
                        },
                        {
                            label: __('Order Details'),
                            fieldname: 'order_details',
                            fieldtype: 'Small Text',
                            reqd: 1
                        }
                    ],
                    primary_action_label: __('Order'),
                    primary_action: function(values) {
                        if (!values.order_date) {
                            frappe.throw(__('Order Date is mandatory.'));
                        }
                        if (!values.order_details) {
                            frappe.throw(__('Order Details are mandatory.'));
                        }
                        frappe.call({
                            method: 'frappe.client.set_value',
                            args: {
                                doctype: 'RTO Registration',
                                name: frm.doc.name,
                                fieldname: {
                                    number_plate_ordered: 1,
                                    order_date: values.order_date,
                                    number_plate_order_details: values.order_details,
                                    status: 'Number Plate Not Received'
                                }
                            },
                            callback: function(r) {
                                if (!r.exc) {
                                    log_rto_activity(frm, 'Number Plate Ordered', 'Order Placed', values.order_details);
                                    frm.reload_doc();
                                    frappe.msgprint({
                                        title: __('Success'),
                                        message: __('Number Plate ordered successfully.'),
                                        indicator: 'green'
                                    });
                                    dialog.hide();
                                } else {
                                    log_rto_activity(frm, 'Number Plate Ordered', 'Order Failed', r.exc || JSON.stringify(r));
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: __('Error ordering Number Plate: ') + (r.exc || JSON.stringify(r)),
                                        indicator: 'red'
                                    });
                                }
                            }
                        });
                    },
                    secondary_action_label: __('Cancel'),
                    secondary_action: function() {
                        dialog.hide();
                        prompt_for_remarks(frm, 'Number Plate Order Cancelled', 'Order Cancelled');
                    }
                });
                dialog.show();
            });
        }

        // Add Number Plate Received button
        if (frm.doc.status === 'Number Plate Not Received' && frm.doc.number_plate_ordered && !frm.doc.number_plate_received) {
            frm.add_custom_button(__('Number Plate Received'), function() {
                let dialog = new frappe.ui.Dialog({
                    title: __('Number Plate Received'),
                    fields: [
                        {
                            label: __('Received Date'),
                            fieldname: 'received_date',
                            fieldtype: 'Datetime',
                            reqd: 1,
                            default: frappe.datetime.now_datetime()
                        },
                        {
                            label: __('Received Details'),
                            fieldname: 'received_details',
                            fieldtype: 'Small Text',
                            reqd: 1
                        }
                    ],
                    primary_action_label: __('Confirm Receipt'),
                    primary_action: function(values) {
                        if (!values.received_date) {
                            frappe.throw(__('Received Date is mandatory.'));
                        }
                        if (!values.received_details) {
                            frappe.throw(__('Received Details are mandatory.'));
                        }
                        frappe.call({
                            method: 'frappe.client.set_value',
                            args: {
                                doctype: 'RTO Registration',
                                name: frm.doc.name,
                                fieldname: {
                                    number_plate_received: 1,
                                    received_date: values.received_date,
                                    number_plate_received_details: values.received_details,
                                    status: 'Due Number Plate Installation'
                                }
                            },
                            callback: function(r) {
                                if (!r.exc) {
                                    log_rto_activity(frm, 'Number Plate Received', 'Receipt Confirmed', values.received_details);
                                    frm.reload_doc();
                                    frappe.msgprint({
                                        title: __('Success'),
                                        message: __('Number Plate receipt confirmed successfully.'),
                                        indicator: 'green'
                                    });
                                    dialog.hide();
                                } else {
                                    log_rto_activity(frm, 'Number Plate Received', 'Receipt Failed', r.exc || JSON.stringify(r));
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: __('Error confirming Number Plate receipt: ') + (r.exc || JSON.stringify(r)),
                                        indicator: 'red'
                                    });
                                }
                            }
                        });
                    },
                    secondary_action_label: __('Cancel'),
                    secondary_action: function() {
                        dialog.hide();
                        prompt_for_remarks(frm, 'Number Plate Receipt Cancelled', 'Receipt Cancelled');
                    }
                });
                dialog.show();
            });
        }

        // Add Number Plate Installation button
if (frm.doc.status === 'Due Number Plate Installation' && frm.doc.number_plate_received && !frm.doc.number_plate_installed) {
    frm.add_custom_button(__('Number Plate Installation'), function() {
        let dialog = new frappe.ui.Dialog({
            title: __('Number Plate Installation'),
            fields: [
                {
                    label: __('Installation Details'),
                    fieldname: 'installation_details',
                    fieldtype: 'Small Text',
                    reqd: 1
                },
                {
                    label: __('Installed By'),
                    fieldname: 'installed_by',
                    fieldtype: 'Link',
                    options: 'User',
                    reqd: 1
                },
                {
                    label: __('Installation Date'),
                    fieldname: 'installation_date',
                    fieldtype: 'Datetime',
                    reqd: 1,
                    default: frappe.datetime.now_datetime()
                },
                {
                    label: __('Number Plate Image'),
                    fieldname: 'number_plate_image',
                    fieldtype: 'Attach Image',
                    reqd: 1
                }
            ],
            primary_action_label: __('Install'),
            primary_action: function(values) {
                if (!values.installation_details) {
                    frappe.throw(__('Installation Details are mandatory.'));
                }
                if (!values.installed_by) {
                    frappe.throw(__('Installed By is mandatory.'));
                }
                if (!values.installation_date) {
                    frappe.throw(__('Installation Date is mandatory.'));
                }
                if (!values.number_plate_image) {
                    frappe.throw(__('Number Plate Image is mandatory.'));
                }
                frappe.call({
                    method: 'frappe.client.set_value',
                    args: {
                        doctype: 'RTO Registration',
                        name: frm.doc.name,
                        fieldname: {
                            number_plate_installed: 1,
                            number_plate_installation_details: values.installation_details,
                            installed_by: values.installed_by,
                            installation_date: values.installation_date,
                            number_plate_image: values.number_plate_image,
                            status: 'Due Documents Submission to DTO'
                        }
                    },
                    callback: function(r) {
                        if (!r.exc) {
                            log_rto_activity(frm, 'Number Plate Installed', 'Installation Completed', `Installed by ${values.installed_by} on ${values.installation_date}`);
                            frm.reload_doc();
                            frappe.msgprint({
                                title: __('Success'),
                                message: __('Number Plate installed successfully.'),
                                indicator: 'green'
                            });
                            dialog.hide();
                        } else {
                            log_rto_activity(frm, 'Number Plate Installed', 'Installation Failed', r.exc || JSON.stringify(r));
                            frappe.msgprint({
                                title: __('Error'),
                                message: __('Error confirming Number Plate installation: ') + (r.exc || JSON.stringify(r)),
                                indicator: 'red'
                            });
                        }
                    }
                });
            },
            secondary_action_label: __('Cancel'),
            secondary_action: function() {
                dialog.hide();
                prompt_for_remarks(frm, 'Number Plate Installation Cancelled', 'Installation Cancelled');
            }
        });
        dialog.show();
    });
}

        // // Add Submit Documents to DTO button
        // if (frm.doc.status === 'Due Documents Submission to DTO' && frm.doc.number_plate_installed && !frm.doc.document_submitted_to_dto) {
        //     frm.add_custom_button(__('Submit Documents to DTO'), function() {
        //         let dialog = new frappe.ui.Dialog({
        //             title: __('Submit Documents to DTO'),
        //             fields: [
        //                 {
        //                     label: __('Submission Date'),
        //                     fieldname: 'doc_sub_date',
        //                     fieldtype: 'Datetime',
        //                     reqd: 1,
        //                     default: frappe.datetime.now_datetime()
        //                 },
        //                 {
        //                     label: __('Remarks'),
        //                     fieldname: 'doc_sub_remarks',
        //                     fieldtype: 'Small Text'
        //                 }
        //             ],
        //             primary_action_label: __('Submit'),
        //             primary_action: function(values) {
        //                 if (!values.doc_sub_date) {
        //                     frappe.throw(__('Submission Date is mandatory.'));
        //                 }
        //                 frappe.call({
        //                     method: 'frappe.client.set_value',
        //                     args: {
        //                         doctype: 'RTO Registration',
        //                         name: frm.doc.name,
        //                         fieldname: {
        //                             doc_sub_date: values.doc_sub_date,
        //                             doc_sub_remarks: values.doc_sub_remarks,
        //                             document_submitted_to_dto: 1,
        //                             status: 'Documents Not Received from DTO'
        //                         }
        //                     },
        //                     callback: function(r) {
        //                         if (!r.exc) {
        //                             log_rto_activity(frm, 'Documents Submitted to DTO', 'Submission Completed', values.doc_sub_remarks);
        //                             frm.reload_doc();
        //                             frappe.msgprint({
        //                                 title: __('Success'),
        //                                 message: __('Documents submitted to DTO successfully.'),
        //                                 indicator: 'green'
        //                             });
        //                             dialog.hide();
        //                         } else {
        //                             log_rto_activity(frm, 'Documents Submitted to DTO', 'Submission Failed', r.exc || JSON.stringify(r));
        //                             frappe.msgprint({
        //                                 title: __('Error'),
        //                                 message: __('Error submitting documents to DTO: ') + (r.exc || JSON.stringify(r)),
        //                                 indicator: 'red'
        //                             });
        //                         }
        //                     }
        //                 });
        //             },
        //             secondary_action_label: __('Cancel'),
        //             secondary_action: function() {
        //                 dialog.hide();
        //                 prompt_for_remarks(frm, 'Document Submission Cancelled', 'Submission Cancelled');
        //             }
        //         });
        //         dialog.show();
        //     });
        // }
if (frm.doc.status === 'Due Documents Submission to DTO' && frm.doc.number_plate_installed && !frm.doc.document_submitted_to_dto) {
    frm.add_custom_button(__('Submit Documents to DTO'), function() {
        // Validate smart card payment status
        let smart_card_ids = frm.doc.additional_accounts
            .filter(account => account.smart_card_id)
            .map(account => account.smart_card_id);

        if (smart_card_ids.length > 0) {
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Vehicle Smart Card',
                    filters: {
                        name: ['in', smart_card_ids]
                    },
                    fields: ['name', 'smart_card_payment_status']
                },
                callback: function(response) {
                    if (response.message) {
                        let due_cards = response.message.filter(card => card.smart_card_payment_status === 'Due');
                        if (due_cards.length > 0) {
                            // Create clickable links for each due smart card
                            let message = __('Smart Card Payment is Due for the following: ') +
                                due_cards.map(card => 
                                    `<a href="/app/vehicle-smart-card/${card.name}" target="_blank">${card.name}</a>`
                                ).join(', ') +
                                __('. Please complete the payment first.');
                            
                            frappe.msgprint({
                                title: __('Payment Due'),
                                message: message,
                                indicator: 'red'
                            });
                            return;
                        } else {
                            // All payments are Paid, show the dialog
                            show_submission_dialog();
                        }
                    } else {
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Unable to verify Smart Card payment status.'),
                            indicator: 'red'
                        });
                    }
                }
            });
        } else {
            // No smart card IDs, show the dialog
            show_submission_dialog();
        }

        function show_submission_dialog() {
            let dialog = new frappe.ui.Dialog({
                title: __('Submit Documents to DTO'),
                fields: [
                    {
                        label: __('Submission Date'),
                        fieldname: 'doc_sub_date',
                        fieldtype: 'Datetime',
                        reqd: 1,
                        default: frappe.datetime.now_datetime()
                    },
                    {
                        label: __('Remarks'),
                        fieldname: 'doc_sub_remarks',
                        fieldtype: 'Small Text'
                    }
                ],
                primary_action_label: __('Submit'),
                primary_action: function(values) {
                    if (!values.doc_sub_date) {
                        frappe.throw(__('Submission Date is mandatory.'));
                    }
                    frappe.call({
                        method: 'frappe.client.set_value',
                        args: {
                            doctype: 'RTO Registration',
                            name: frm.doc.name,
                            fieldname: {
                                doc_sub_date: values.doc_sub_date,
                                doc_sub_remarks: values.doc_sub_remarks,
                                document_submitted_to_dto: 1,
                                status: 'Documents Not Received from DTO'
                            }
                        },
                        callback: function(r) {
                            if (!r.exc) {
                                log_rto_activity(frm, 'Documents Submitted to DTO', 'Submission Completed', values.doc_sub_remarks);
                                frm.reload_doc();
                                frappe.msgprint({
                                    title: __('Success'),
                                    message: __('Documents submitted to DTO successfully.'),
                                    indicator: 'green'
                                });
                                dialog.hide();
                            } else {
                                log_rto_activity(frm, 'Documents Submitted to DTO', 'Submission Failed', r.exc || JSON.stringify(r));
                                frappe.msgprint({
                                    title: __('Error'),
                                    message: __('Error submitting documents to DTO: ') + (r.exc || JSON.stringify(r)),
                                    indicator: 'red'
                                });
                            }
                        }
                    });
                },
                secondary_action_label: __('Cancel'),
                secondary_action: function() {
                    dialog.hide();
                    prompt_for_remarks(frm, 'Document Submission Cancelled', 'Submission Cancelled');
                }
            });
            dialog.show();
        }
    });
}

        // Add Documents Received from DTO button
        if (frm.doc.status === 'Documents Not Received from DTO' && frm.doc.document_submitted_to_dto && !frm.doc.document_received_from_dto) {
            frm.add_custom_button(__('Documents Received from DTO'), function() {
                let dialog = new frappe.ui.Dialog({
                    title: __('Documents Received from DTO'),
                    fields: [
                        {
                            label: __('Received Date'),
                            fieldname: 'doc_rec_date',
                            fieldtype: 'Datetime',
                            reqd: 1,
                            default: frappe.datetime.now_datetime()
                        },
                        {
                            label: __('Remarks'),
                            fieldname: 'doc_rec_remarks',
                            fieldtype: 'Small Text'
                        }
                    ],
                    primary_action_label: __('Confirm Receipt'),
                    primary_action: function(values) {
                        if (!values.doc_rec_date) {
                            frappe.throw(__('Received Date is mandatory.'));
                        }
                        frappe.call({
                            method: 'frappe.client.set_value',
                            args: {
                                doctype: 'RTO Registration',
                                name: frm.doc.name,
                                fieldname: {
                                    doc_rec_date: values.doc_rec_date,
                                    doc_rec_remarks: values.doc_rec_remarks,
                                    document_received_from_dto: 1,
                                    status: 'Due Scanning RC'
                                }
                            },
                            callback: function(r) {
                                if (!r.exc) {
                                    log_rto_activity(frm, 'Documents Received from DTO', 'Receipt Confirmed', values.doc_rec_remarks);
                                    frm.reload_doc();
                                    frappe.msgprint({
                                        title: __('Success'),
                                        message: __('Documents received from DTO successfully.'),
                                        indicator: 'green'
                                    });
                                    dialog.hide();
                                } else {
                                    log_rto_activity(frm, 'Documents Received from DTO', 'Receipt Failed', r.exc || JSON.stringify(r));
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: __('Error confirming receipt of documents: ') + (r.exc || JSON.stringify(r)),
                                        indicator: 'red'
                                    });
                                }
                            }
                        });
                    },
                    secondary_action_label: __('Cancel'),
                    secondary_action: function() {
                        dialog.hide();
                        prompt_for_remarks(frm, 'Document Receipt Cancelled', 'Receipt Cancelled');
                    }
                });
                dialog.show();
            });
        }

        // // Add Attach Scanned Document button
        // if (frm.doc.status === 'Due Scanning RC' && frm.doc.document_received_from_dto) {
        //     frm.add_custom_button(__('Attach Scanned Document'), function() {
        //         const attach_btn = frm.fields_dict.rc_document.$wrapper.find('.btn-attach');
        //         if (attach_btn.length) {
        //             attach_btn.click();
        //             frappe.after_ajax(() => {
        //                 // Monitor changes to rc_document field
        //                 let checkDocument = setInterval(() => {
        //                     if (frm.doc.rc_document && frm.doc.rc_document !== frm.get_field('rc_document')._last_value) {
        //                         clearInterval(checkDocument);
        //                         frappe.call({
        //                             method: 'frappe.client.set_value',
        //                             args: {
        //                                 doctype: 'RTO Registration',
        //                                 name: frm.doc.name,
        //                                 fieldname: {
        //                                     attachment_attach: frm.doc.rc_document,
        //                                     status: 'Due Handover to Customer'
        //                                 }
        //                             },
        //                             callback: function(r) {
        //                                 if (!r.exc) {
        //                                     log_rto_activity(frm, 'Scanned RC Attached', 'Document Attached', `Attachment added: ${frm.doc.rc_document}`);
        //                                     frm.reload_doc();
        //                                     frappe.msgprint({
        //                                         title: __('Success'),
        //                                         message: __('Scanned RC document attached successfully.'),
        //                                         indicator: 'green'
        //                                     });
        //                                 } else {
        //                                     log_rto_activity(frm, 'Scanned RC Attached', 'Attachment Failed', r.exc || JSON.stringify(r));
        //                                     frappe.msgprint({
        //                                         title: __('Error'),
        //                                         message: __('Error attaching scanned RC document: ') + (r.exc || JSON.stringify(r)),
        //                                         indicator: 'red'
        //                                     });
        //                                 }
        //                             }
        //                         });
        //                     }
        //                 }, 1000); // Check every second
        //             });
        //         } else {
        //             frappe.msgprint({
        //                 title: __('Error'),
        //                 message: __('Attach button for rc_document not found.'),
        //                 indicator: 'red'
        //             });
        //         }
        //     });
        // }

        if (frm.doc.status === 'Due Scanning RC' && frm.doc.document_received_from_dto) {
    frm.add_custom_button(__('Attach Scanned Document'), function() {
        let dialog = new frappe.ui.Dialog({
            title: __('Attach Scanned Document'),
            fields: [
                {
                    label: __('Scanned RC Document'),
                    fieldname: 'rc_document',
                    fieldtype: 'Attach Image',
                    reqd: 1
                }
            ],
            primary_action_label: __('Submit'),
            primary_action: function(values) {
                if (!values.rc_document) {
                    frappe.throw(__('Scanned RC Document is mandatory.'));
                }
                frappe.call({
                    method: 'frappe.client.set_value',
                    args: {
                        doctype: 'RTO Registration',
                        name: frm.doc.name,
                        fieldname: {
                            rc_document: values.rc_document,
                            status: 'Due Handover to Customer'
                        }
                    },
                    callback: function(r) {
                        if (!r.exc) {
                            log_rto_activity(frm, 'Scanned RC Attached', 'Document Attached', `Scanned RC document attached on ${frappe.datetime.now_datetime()}`);
                            frm.reload_doc();
                            frappe.msgprint({
                                title: __('Success'),
                                message: __('Scanned RC document attached successfully.'),
                                indicator: 'green'
                            });
                            dialog.hide();
                        } else {
                            log_rto_activity(frm, 'Scanned RC Attached', 'Attachment Failed', r.exc || JSON.stringify(r));
                            frappe.msgprint({
                                title: __('Error'),
                                message: __('Error attaching Scanned RC document: ') + (r.exc || JSON.stringify(r)),
                                indicator: 'red'
                            });
                        }
                    }
                });
            },
            secondary_action_label: __('Cancel'),
            secondary_action: function() {
                dialog.hide();
                prompt_for_remarks(frm, 'Scanned RC Attachment Cancelled', 'Attachment Cancelled');
            }
        });
        dialog.show();
    });
}

        // Add Handover to Customer button
        if (frm.doc.status === 'Due Handover to Customer' && frm.doc.rc_document && !frm.doc.handover_to_customer) {
            frm.add_custom_button(__('Handover to Customer'), function() {
                let dialog = new frappe.ui.Dialog({
                    title: __('Handover to Customer'),
                    fields: [
                        {
                            label: __('Handover Date'),
                            fieldname: 'handover_date',
                            fieldtype: 'Datetime',
                            reqd: 1,
                            default: frappe.datetime.now_datetime()
                        },
                        {
                            label: __('To Customer'),
                            fieldname: 'to_customer',
                            fieldtype: 'Data',
                            reqd: 1,
                            default: frm.doc.customer
                        },
                        {
                            label: __('Handover Remarks'),
                            fieldname: 'handover_remarks',
                            fieldtype: 'Small Text'
                        }
                    ],
                    primary_action_label: __('Handover'),
                    primary_action: function(values) {
                        if (!values.handover_date) {
                            frappe.throw(__('Handover Date is mandatory.'));
                        }
                        if (!values.to_customer) {
                            frappe.throw(__('To Customer is mandatory.'));
                        }
                        frappe.call({
                            method: 'frappe.client.set_value',
                            args: {
                                doctype: 'RTO Registration',
                                name: frm.doc.name,
                                fieldname: {
                                    handover_date: values.handover_date,
                                    to_customer: values.to_customer,
                                    handover_remarks: values.handover_remarks,
                                    handover_to_customer: 1,
                                    status: 'Completed',
                                    registration_status: 'Handover to Customer'
                                }
                            },
                            callback: function(r) {
                                if (!r.exc) {
                                    log_rto_activity(frm, 'Handover to Customer', 'Handover Completed', values.handover_remarks || `Handed over to ${values.to_customer}`);
                                    frm.reload_doc();
                                    frappe.msgprint({
                                        title: __('Success'),
                                        message: __('Documents handed over to customer successfully.'),
                                        indicator: 'green'
                                    });
                                    dialog.hide();
                                } else {
                                    log_rto_activity(frm, 'Handover to Customer', 'Handover Failed', r.exc || JSON.stringify(r));
                                    frappe.msgprint({
                                        title: __('Error'),
                                        message: __('Error handing over documents: ') + (r.exc || JSON.stringify(r)),
                                        indicator: 'red'
                                    });
                                }
                            }
                        });
                    },
                    secondary_action_label: __('Cancel'),
                    secondary_action: function() {
                        dialog.hide();
                        prompt_for_remarks(frm, 'Handover to Customer Cancelled', 'Handover Cancelled');
                    }
                });
                dialog.show();
            });
        }
    }
});

// Reusable function to log activity in rto_activity child table
function log_rto_activity(frm, activity, status, remarks) {
    let activity_log = {
        doctype: 'RTO Activity Log',
        activity: activity,
        status: status,
        user: frappe.session.user,
        update_on: frappe.datetime.now_datetime(),
        remarks: remarks || '',
        parent: frm.doc.name,
        parentfield: 'rto_activity',
        parenttype: 'RTO Registration'
    };

    frappe.call({
        method: 'frappe.client.insert',
        args: {
            doc: activity_log
        },
        callback: function(r) {
            if (r.exc) {
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error logging activity: ') + (r.exc || JSON.stringify(r)),
                    indicator: 'red'
                });
                console.error('Activity Log Error:', r.exc);
            }
        }
    });
}

// Reusable function to prompt for remarks on cancellation
function prompt_for_remarks(frm, activity, status) {
    let remark_dialog = new frappe.ui.Dialog({
        title: __('Enter Remarks'),
        fields: [
            {
                label: __('Remarks'),
                fieldname: 'remarks',
                fieldtype: 'Small Text',
                reqd: 1,
                description: __('Please provide the reason for cancellation.')
            }
        ],
        primary_action_label: __('Save'),
        primary_action: function(values) {
            log_rto_activity(frm, activity, status, values.remarks);
            frm.reload_doc();
            frappe.msgprint({
                title: __('Success'),
                message: __('Remarks added successfully.'),
                indicator: 'green'
            });
            remark_dialog.hide();
        },
        secondary_action_label: __('Cancel'),
        secondary_action: function() {
            remark_dialog.hide();
        }
    });
    remark_dialog.show();
}



// role based permissions for custom buttons
// Function to restrict custom buttons based on roles
function restrict_custom_buttons_by_role(frm) {
    // Store the original add_custom_button method
    const original_add_custom_button = frm.add_custom_button;

    // Override add_custom_button
    frm.add_custom_button = function(label, callback, group) {
        // Check role-based visibility
        frappe.call({
            method: 'autowings_app.custom_scripts.utils.can_show_button',
            args: {
                link_doc: frm.doc.doctype,
                button_name: label
            },
            callback: function(r) {
                if (r.message) {
                    // User is authorized; call the original method
                    original_add_custom_button.call(frm, label, callback, group);
                }
            },
            error: function(err) {
                frappe.msgprint({
                    title: __('Error'),
                    message: __('Error checking button visibility for ') + label + ': ' + err.message,
                    indicator: 'red'
                });
            }
        });
    };
}



frappe.ui.form.on("RTO Registration", {
    refresh: function(frm) {
        restrict_custom_buttons_by_role(frm);
        
        frm.add_custom_button(__("Cancel Journal Entry"), function() {
            // Prompt for confirmation
            frappe.confirm(
                __("Are you sure you want to cancel or delete the linked Journal Entry?"),
                function() {
                    // Proceed with the server-side call if confirmed
                    frappe.call({
                        method: "autowings_app.custom_scripts.vehicle_sales_journal_cancel.cancel_journal_entry_rto",
                        args: {
                            doc: frm.doc
                        },
                        callback: function(r) {
                            if (r.message) {
                                frm.reload_doc();
                            }
                        }
                    });
                },
                function() {
                    // Do nothing if the user cancels the prompt
                    frappe.msgprint(__("Action aborted."));
                }
            );
        }, __("Actions"));
    }
});