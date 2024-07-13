import emailjs from '@emailjs/browser';

export default function sendEmail(form: React.MutableRefObject<HTMLFormElement>) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    emailjs
      .sendForm('service_ynv83op', 'template_3oljtxo', form.current, '92Cb78cmp5MUyYktO')
      .then(
        (result) => {
          console.log(result.text);
        },
        (error) => {
          console.log(error.text);
        }
      );
  };
}
