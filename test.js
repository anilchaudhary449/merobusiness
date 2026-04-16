const rawQuery = `<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2899.5490711559523!2d81.28947147451977!3d28.483873890817613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39a277f1c65ca2f3%3A0x3bf4bbbe30cc5984!2z4KSg4KS-4KSV4KWB4KSw4KSs4KS-4KSs4KS-IOCkleCkv-CksOCkvuCkqOCkviDgpKTgpKXgpL4g4KSV4KS44KWN4KSu4KWH4KSf4KS_4KSVIOCkquCkuOCksiBbVGhha3VyYmFiYSBLaXJhbmEgYW5kIENvc21ldGljIFNob3Bd!5e1!3m2!1sen!2snp!4v1776312376545!5m2!1sen!2snp" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

const getMapSrc = () => {
    if (rawQuery.includes('<iframe') && rawQuery.includes('src="')) {
      const match = rawQuery.match(/src="([^"]+)"/);
      if (match && match[1]) return match[1];
    }
    if (rawQuery.startsWith('http')) {
      return rawQuery;
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(rawQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
};
console.log(getMapSrc());
