import { Link, Outlet } from 'react-router-dom';
import useStyles from '../hooks/useStyles.js';
import publicCss from '../styles/public.css?inline';

const LOGO = 'https://vvcmc.in/wp-content/uploads/2025/01/VVCMC-New-Logo-Marathi-2048x224-1.png';

export default function PublicLayout() {
  useStyles(publicCss);

  return (
    <>
      <div className="top">
        <span>वसई विरार शहर महानगरपालिकेमध्ये आपले स्वागत आहे</span>
        <form className="sf" onSubmit={(e) => e.preventDefault()}>
          <input type="text" name="q" placeholder="शोधा / Search" aria-label="Search" />{' '}
          <button type="submit">शोधा</button>
        </form>
      </div>
      <div className="hdr">
        <a href="https://vvcmc.in">
          <img src={LOGO} alt="वसई विरार शहर महानगरपालिका" />
        </a>
      </div>
      <nav>
        <a href="https://vvcmc.in">मुख्यपृष्ठ</a>
        <a href="https://vvcmc.in/vasai-virar-city/">वसई विरार</a>
        <a href="#">विभाग</a>
        <a href="#">कार्यालयीन कामकाज</a>
        <Link to="/citizendashboard" className="on">शहरातील सुविधा</Link>
        <a href="https://vvcmc.in/important-contact/">आपत्ती व्यवस्थापन संपर्क</a>
        <a href="https://vvcmc.in/contacts/">संपर्क</a>
      </nav>

      <Outlet />

      <footer>
        <div className="in">
          <div>
            <b>पत्ता</b>
            <br />
            वसई विरार शहर महानगरपालिका (मुख्य कार्यालय)
            <br />
            विराट नगर, म्हाडा कॉलनी जवळ, विरार पश्चिम. पिन : 401303
          </div>
          <div>
            <b>संपर्क क्रमांक</b>
            <br />
            मुख्य कार्यालय: 0250-6630000
            <br />
            आपत्ती व्यवस्थापन: 0250-2334546 / 0250-2334547
          </div>
          <div>
            <b>लिंक्स</b>
            <br />
            <a href="https://vvcmc.in/hospitals/">रुग्णालये</a> | <a href="https://vvcmc.in/ambulance/">रुग्णवाहिका</a>
            <br />© Vasai Virar City Municipal Corporation. All Rights Reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
