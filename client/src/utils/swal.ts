import Swal from 'sweetalert2';

// Configure SweetAlert2 with RTL and custom styling
const Toast = Swal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'swal2-rtl',
  },
});

export const showToast = {
  success: (message: string) => Toast.fire({ icon: 'success', title: message }),
  error: (message: string) => Toast.fire({ icon: 'error', title: message }),
  warning: (message: string) => Toast.fire({ icon: 'warning', title: message }),
  info: (message: string) => Toast.fire({ icon: 'info', title: message }),
};

export const showConfirm = async (title: string, text: string) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#7C3AED',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'כן, המשך',
    cancelButtonText: 'ביטול',
    customClass: {
      popup: 'swal2-rtl',
    },
  });
  return result.isConfirmed;
};

export const showSendOptions = async (whatsappUrl: string | null, onEmailClick: () => void) => {
  const result = await Swal.fire({
    title: 'הטופס נשלח בהצלחה!',
    html: `
      <p class="text-gray-600 mb-4">איך תרצה לשלוח את הטופס החתום?</p>
    `,
    icon: 'success',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonColor: '#25D366',
    denyButtonColor: '#3B82F6',
    cancelButtonColor: '#6B7280',
    confirmButtonText: '<span class="flex items-center gap-2">📱 שלח בוואטסאפ</span>',
    denyButtonText: '<span class="flex items-center gap-2">📧 שלח במייל</span>',
    cancelButtonText: 'סגור',
    customClass: {
      popup: 'swal2-rtl',
      actions: 'flex-row-reverse gap-2',
    },
  });

  if (result.isConfirmed && whatsappUrl) {
    window.open(whatsappUrl, '_blank');
  } else if (result.isDenied) {
    onEmailClick();
  }
};

export const showEmailInput = async () => {
  const result = await Swal.fire({
    title: 'שליחה במייל',
    input: 'email',
    inputLabel: 'הזן כתובת מייל לשליחה',
    inputPlaceholder: 'example@email.com',
    showCancelButton: true,
    confirmButtonColor: '#3B82F6',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'שלח',
    cancelButtonText: 'ביטול',
    customClass: {
      popup: 'swal2-rtl',
      input: 'text-left',
    },
    inputValidator: (value) => {
      if (!value) {
        return 'נא להזין כתובת מייל';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'כתובת מייל לא תקינה';
      }
      return null;
    },
  });

  return result.isConfirmed ? result.value : null;
};

export const showLoading = (title = 'טוען...') => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    customClass: {
      popup: 'swal2-rtl',
    },
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export const hideLoading = () => {
  Swal.close();
};

export default Swal;
