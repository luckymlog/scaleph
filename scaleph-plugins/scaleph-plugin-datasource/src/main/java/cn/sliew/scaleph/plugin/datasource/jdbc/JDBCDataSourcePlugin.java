package cn.sliew.scaleph.plugin.datasource.jdbc;

import cn.sliew.milky.common.exception.Rethrower;
import cn.sliew.milky.common.util.JacksonUtil;
import cn.sliew.scaleph.plugin.datasource.DataSourcePlugin;
import cn.sliew.scaleph.plugin.framework.core.AbstractPlugin;
import cn.sliew.scaleph.plugin.framework.core.PluginInfo;
import cn.sliew.scaleph.plugin.framework.property.PropertyDescriptor;
import cn.sliew.scaleph.plugin.framework.property.ValidationResult;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;
import java.net.URL;
import java.nio.file.Paths;
import java.util.*;

import static cn.sliew.scaleph.plugin.datasource.jdbc.JdbcPoolProperties.*;

public class JDBCDataSourcePlugin extends AbstractPlugin implements DataSourcePlugin<DataSource> {

    private static final List<PropertyDescriptor> supportedProperties;

    static {
        final List<PropertyDescriptor> props = new ArrayList<>();
        props.add(JDBC_URL);
        props.add(DRIVER_CLASS_NAME);
        props.add(USERNAME);
        props.add(PASSWORD);
        props.add(MININUM_IDLE);
        props.add(MAXIMUM_POOL_SIZE);
        props.add(IDLE_TIMEOUT);
        props.add(VALIDATION_QUERY);
        supportedProperties = Collections.unmodifiableList(props);
    }

    private final PluginInfo pluginInfo;
    private volatile Properties properties;
    private volatile Properties additionalProperties;
    private volatile HikariDataSource dataSource;

    public JDBCDataSourcePlugin() {
        PluginInfo pluginInfo = null;
        try {
            final URL resource = JDBCDataSourcePlugin.class.getClassLoader().getResource("");
            pluginInfo = PluginInfo.readFromProperties(Paths.get(resource.toURI()));
        } catch (Exception e) {
            Rethrower.throwAs(e);
        }
        this.pluginInfo = pluginInfo;
    }

    @Override
    public DataSource getDataSource() {
        return dataSource;
    }

    @Override
    public PluginInfo getPluginInfo() {
        return pluginInfo;
    }

    @Override
    public List<PropertyDescriptor> getSupportedProperties() {
        return supportedProperties;
    }

    @Override
    public void initialize(Properties properties) {
        final Collection<ValidationResult> validate = validate(properties);
        final Optional<ValidationResult> validationResult = validate.stream().filter(result -> result.isValid() == false).findAny();
        if (validationResult.isPresent()) {
            throw new IllegalArgumentException(JacksonUtil.toJsonString(validationResult.get()));
        }
        this.properties = properties;
    }

    @Override
    public void setAdditionalProperties(Properties properties) {
        this.additionalProperties = properties;
    }

    @Override
    public void start() {
        if (Optional.ofNullable(properties).isPresent() == false) {
            throw new IllegalStateException("jdbc datasource plugin not initialized!");
        }
        HikariConfig config = new HikariConfig(properties);
        config.setDataSourceProperties(additionalProperties);
        config.setMetricRegistry(meterRegistry);
        this.dataSource = new HikariDataSource(config);
    }

    @Override
    public void shutdown() {
        dataSource.close();
    }
}
